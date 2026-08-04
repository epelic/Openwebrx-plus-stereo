class OwrxAudioProcessor extends AudioWorkletProcessor {
    constructor(options){
        super(options);
        // initialize ringbuffer, make sure it aligns with the expected buffer size of 128
        this.bufferSize = Math.round(options.processorOptions.maxBufferSize / 128) * 128;
        this.leftBuffer = new Float32Array(this.bufferSize);
        this.rightBuffer = new Float32Array(this.bufferSize);
        this.inPos = 0;
        this.outPos = 0;
        this.samplesProcessed = 0;
        this.port.addEventListener('message', (m) => {
            if (typeof(m.data) === 'string') {
                const json = JSON.parse(m.data);
                if (json.cmd && json.cmd === 'getStats') {
                    this.reportStats();
                }
            } else {
                const stereo = !!m.data.stereo;
                const samples = m.data.samples || m.data;
                const frames = stereo ? Math.floor(samples.length / 2) : samples.length;
                for (let i = 0; i < frames; i++) {
                    const p = (this.inPos + i) % this.bufferSize;
                    this.leftBuffer[p] = samples[stereo ? i * 2 : i];
                    this.rightBuffer[p] = samples[stereo ? i * 2 + 1 : i];
                }
                this.inPos = (this.inPos + frames) % this.bufferSize;
            }
        });
        this.port.addEventListener('messageerror', console.error);
        this.port.start();
    }
    process(inputs, outputs) {
        if (this.remaining() < 128) {
            outputs[0].forEach(output => output.fill(0));
            return true;
        }
        const output = outputs[0];
        for (let i = 0; i < 128; i++) {
            const p = (this.outPos + i) % this.bufferSize;
            output[0][i] = this.leftBuffer[p];
            output[1][i] = this.rightBuffer[p];
        }
        this.outPos = (this.outPos + 128) % this.bufferSize;
        this.samplesProcessed += 128;
        return true;
    }
    remaining() {
        const mod = (this.inPos - this.outPos) % this.bufferSize;
        if (mod >= 0) return mod;
        return mod + this.bufferSize;
    }
    reportStats() {
        this.port.postMessage(JSON.stringify({
            buffersize: this.remaining(),
            samplesProcessed: this.samplesProcessed
        }));
        this.samplesProcessed = 0;
    }
}

registerProcessor('openwebrx-audio-processor', OwrxAudioProcessor);
