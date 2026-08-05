from csdr.chain.demodulator import BaseDemodulatorChain, FixedIfSampleRateChain, HdAudio, \
    FixedAudioRateChain, DeemphasisTauChain, MetaProvider, RdsChain
from pycsdr.modules import AmDemod, DcBlock, FmDemod, Limit, NfmDeemphasis, Agc, Afc, \
    WfmDeemphasis, FractionalDecimator, StereoFractionalDecimator, RealPart, Writer, Buffer
from pycsdr.types import Format, AgcProfile
from csdr.chain.toolbox import RdsDemodulator
from typing import Optional
from owrx.feature import FeatureDetector
from threading import Event, Thread
import pickle
import time


class Am(BaseDemodulatorChain):
    def __init__(self, agcProfile: AgcProfile = AgcProfile.SLOW):
        agc = Agc(Format.FLOAT)
        agc.setProfile(agcProfile)
        agc.setInitialGain(200)
        workers = [
            AmDemod(),
            DcBlock(),
            agc,
        ]
        super().__init__(workers)


class NFm(BaseDemodulatorChain):
    def __init__(self, sampleRate: int, agcProfile: AgcProfile = AgcProfile.SLOW):
        self.sampleRate = sampleRate
        agc = Agc(Format.FLOAT)
        agc.setProfile(agcProfile)
        agc.setMaxGain(3)
        workers = [
            FmDemod(),
            Limit(),
            NfmDeemphasis(sampleRate),
            agc,
        ]
        super().__init__(workers)

    def setSampleRate(self, sampleRate: int) -> None:
        if sampleRate == self.sampleRate:
            return
        self.sampleRate = sampleRate
        self.replace(2, NfmDeemphasis(sampleRate))


class WFm(BaseDemodulatorChain, FixedIfSampleRateChain, DeemphasisTauChain, HdAudio, MetaProvider, RdsChain):
    def __init__(self, sampleRate: int, tau: float, rdsRbds: bool):
        self.sampleRate = sampleRate
        self.tau = tau
        self.rdsRbds = rdsRbds
        self.fmDemod = FmDemod()
        self.limit = Limit()
        # Tap the discriminator output before limiting, de-emphasis and stereo decoding.
        # FmDemod returns phase delta / pi, so 1.0 equals half the IF sample rate.
        self.deviationTapBuffer = Buffer(Format.FLOAT)
        # this buffer is used to tap into the raw audio stream for redsea RDS decoding
        self.metaTapBuffer = Buffer(Format.FLOAT)
        workers = [
            self.fmDemod,
            self.limit,
            StereoFractionalDecimator(
                Format.FLOAT, 200000.0, 200000.0 / self.sampleRate,
                self.tau, prefilter=True
            ),
        ]
        self.metaChain = None
        self.metaWriter = None
        self.deviationReader = None
        self.deviationThread = None
        self.deviationStop = Event()
        super().__init__(workers)

    def _connect(self, w1, w2, buffer: Optional[Buffer] = None) -> None:
        if w1 is self.fmDemod:
            buffer = self.deviationTapBuffer
        elif w1 is self.limit:
            buffer = self.metaTapBuffer
        super()._connect(w1, w2, buffer)

    def _measureDeviation(self) -> None:
        peak = 0.0
        nextReport = time.monotonic() + 0.25
        while not self.deviationStop.is_set():
            data = self.deviationReader.read()
            if data is None:
                break
            samples = memoryview(data).cast("f")
            if len(samples):
                peak = max(peak, max(abs(sample) for sample in samples))
            now = time.monotonic()
            if now >= nextReport:
                writer = self.metaWriter
                if writer is not None:
                    deviation = min(75.0, peak * self.getFixedIfSampleRate() / 2000.0)
                    writer.write(pickle.dumps({"mode": "WFM", "deviation": deviation}))
                peak = 0.0
                nextReport = now + 0.25

    def _startDeviationMeter(self) -> None:
        if self.deviationThread is not None:
            return
        self.deviationStop.clear()
        self.deviationReader = self.deviationTapBuffer.getReader()
        self.deviationThread = Thread(target=self._measureDeviation, daemon=True)
        self.deviationThread.start()

    def _stopDeviationMeter(self) -> None:
        self.deviationStop.set()
        if self.deviationReader is not None:
            self.deviationReader.stop()
        if self.deviationThread is not None:
            self.deviationThread.join(timeout=1)
        self.deviationReader = None
        self.deviationThread = None

    def getFixedIfSampleRate(self):
        return 200000

    def setDeemphasisTau(self, tau: float) -> None:
        if tau == self.tau:
            return
        self.tau = tau
        self.replace(2, StereoFractionalDecimator(
            Format.FLOAT, 200000.0, 200000.0 / self.sampleRate,
            self.tau, prefilter=True
        ))

    def setSampleRate(self, sampleRate: int) -> None:
        if sampleRate == self.sampleRate:
            return
        self.sampleRate = sampleRate
        self.replace(2, StereoFractionalDecimator(
            Format.FLOAT, 200000.0, 200000.0 / self.sampleRate,
            self.tau, prefilter=True
        ))

    def setMetaWriter(self, writer: Writer) -> None:
        if not FeatureDetector().is_available("rds"):
            return
        if self.metaChain is None:
            self.metaChain = RdsDemodulator(self.getFixedIfSampleRate(), self.rdsRbds)
            self.metaChain.setReader(self.metaTapBuffer.getReader())
        self.metaWriter = writer
        self.metaChain.setWriter(self.metaWriter)
        self._startDeviationMeter()

    def stop(self):
        self._stopDeviationMeter()
        super().stop()
        if self.metaChain is not None:
            self.metaChain.stop()
            self.metaChain = None
            self.metaWriter = None

    def setRdsRbds(self, rdsRbds: bool) -> None:
        self.rdsRbds = rdsRbds
        if self.metaChain is not None:
            self.metaChain.stop()
            self.metaChain = RdsDemodulator(self.getFixedIfSampleRate(), self.rdsRbds)
            self.metaChain.setReader(self.metaTapBuffer.getReader())
            self.metaChain.setWriter(self.metaWriter)


class Ssb(BaseDemodulatorChain):
    def __init__(self, agcProfile: AgcProfile = AgcProfile.FAST):
        agc = Agc(Format.FLOAT)
        agc.setProfile(agcProfile)
        workers = [
            RealPart(),
            agc,
        ]
        super().__init__(workers)


class Empty(BaseDemodulatorChain):
    def __init__(self):
        super().__init__([])

    def getOutputFormat(self) -> Format:
        return Format.FLOAT

    def setWriter(self, writer):
        pass


class SAm(BaseDemodulatorChain):
    def __init__(self, agcProfile: AgcProfile = AgcProfile.SLOW):
        self.updatePeriod = 10
        self.samplePeriod = 4
        agc = Agc(Format.FLOAT)
        agc.setProfile(agcProfile)
        agc.setInitialGain(200)
        workers = [
            Afc(self.updatePeriod, self.samplePeriod),
            RealPart(),
            DcBlock(),
            agc,
        ]
        super().__init__(workers)


class SsbDigital(BaseDemodulatorChain, FixedAudioRateChain, HdAudio):
    def __init__(self, sampleRate: int = 48000):
        self.sampleRate = sampleRate
        workers = [
            RealPart(),
            Agc(Format.FLOAT),
        ]
        super().__init__(workers)

    def getFixedAudioRate(self) -> int:
        return self.sampleRate
