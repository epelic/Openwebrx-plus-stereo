(function(){
  'use strict';
  function q(s,r){return (r||document).querySelector(s)}
  function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function make(tag,id,cls){var e=document.createElement(tag);if(id)e.id=id;if(cls)e.className=cls;return e}
  function retitle(){document.title='Max Mountain Station | Tactical SDR Console v5.2';var t=q('.webrx-rx-title');if(t)t.textContent='MAX MOUNTAIN STATION'}
  function visible(el){var s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&el.offsetParent!==null}

  function buildWorkspace(){
    if(q('#mm-workspace'))return true;
    var page=q('#webrx-page-container'), waterfall=q('.openwebrx-waterfall-container');
    var left=q('#openwebrx-panels-container-left'), right=q('#openwebrx-panels-container-right');
    var buttons=q('.openwebrx-main-buttons');
    if(!page||!waterfall||!left||!right||!buttons)return false;
    var ws=make('main','mm-workspace');
    var rail=make('nav','mm-command-rail');
    var railHead=make('div','mm-command-head');railHead.textContent='COMMAND';
    var railScroll=make('div','mm-command-scroll');
    var main=make('section','mm-main-column');
    var spec=make('section','mm-spectrum-slot');
    var dock=make('section','mm-decoder-dock');
    var side=make('aside','mm-sidebar');
    var sh=make('div','mm-sidebar-head');sh.innerHTML='<span>RX CONTROL DECK</span><span id="mm-utc-clock">--:--:-- UTC</span>';
    var scroll=make('div','mm-sidebar-scroll');
    page.appendChild(ws);ws.appendChild(rail);ws.appendChild(main);ws.appendChild(side);
    rail.appendChild(railHead);rail.appendChild(railScroll);railScroll.appendChild(buttons);
    main.appendChild(spec);main.appendChild(dock);spec.appendChild(waterfall);dock.appendChild(left);
    side.appendChild(sh);side.appendChild(scroll);scroll.appendChild(right);
    normalizeButtons();pinReceiver();updateDock();
    new MutationObserver(function(){pinReceiver();updateDock();normalizeButtons();removeUIKit()}).observe(page,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
    return true;
  }

  function normalizeButtons(){
    var buttons=q('.openwebrx-main-buttons');if(!buttons)return;
    qa('.button',buttons).forEach(function(b){b.removeAttribute('style');var txt=(b.textContent||'').replace(/\s+/g,' ').trim();if(txt)b.title=b.title||txt});
    var rb=q('[data-toggle-panel="openwebrx-panel-receiver"]',buttons);
    if(rb&&!rb.dataset.mmPinned){
      rb.dataset.mmPinned='1';
      rb.addEventListener('click',function(ev){ev.preventDefault();ev.stopImmediatePropagation();pinReceiver();var p=q('#openwebrx-panel-receiver');if(p)p.scrollIntoView({behavior:'smooth',block:'start'})},true)
    }
  }

  function pinReceiver(){
    var side=q('#openwebrx-panels-container-right'), scroll=q('#mm-sidebar-scroll');
    if(!side||!scroll)return;
    if(side.parentNode!==scroll)scroll.appendChild(side);
    var p=q('#openwebrx-panel-receiver');
    if(!p)return;
    if(p.parentNode!==side)side.insertBefore(p,side.firstChild);
    p.style.setProperty('display','block','important');
    p.style.setProperty('visibility','visible','important');
    p.style.setProperty('opacity','1','important');
    p.removeAttribute('hidden');p.setAttribute('aria-hidden','false');
    addSignalModule(p);addInlineAudioAnalyzer(p)
  }

  function updateDock(){var d=q('#mm-decoder-dock'),l=q('#openwebrx-panels-container-left');if(!d||!l)return;var any=qa(':scope > .openwebrx-panel',l).some(visible);d.classList.toggle('mm-empty',!any)}

  function addSignalModule(p){
    if(!p||q('#mm-signal-module'))return;
    var m=make('div','mm-signal-module');
    m.innerHTML='<div class="mm-sig-head"><span>RF SIGNAL LEVEL</span><span class="mm-sig-value">S -- / -- dB</span></div><div class="mm-sig-track"><div class="mm-sig-fill"></div></div><div class="mm-sig-scale"><span>S1</span><span>S3</span><span>S5</span><span>S7</span><span>S9</span><span>+40</span></div>';
    var f=q('.frequencies-container',p);if(f&&f.nextSibling)p.insertBefore(m,f.nextSibling);else p.insertBefore(m,p.firstChild);
    setInterval(function(){var text='';qa('.smeter-value,.s-meter-value,[data-smeter],.openwebrx-smeter-value').some(function(e){text=(e.textContent||'').trim();return !!text});var value=-105,mt=text.match(/-?\d+(?:\.\d+)?/);if(mt)value=parseFloat(mt[0]);var fill=q('.mm-sig-fill',m),val=q('.mm-sig-value',m);if(fill)fill.style.width=Math.max(3,Math.min(100,(value+120)/.7))+'%';if(val)val.textContent=text||'S -- / -- dB'},500)
  }

  function addInlineAudioAnalyzer(p){
    if(!p||q('#mm-audio-analyzer'))return;
    var box=make('section','mm-audio-analyzer');
    box.innerHTML='<div class="mm-audio-head"><span>AUDIO SPECTRUM</span><span id="mm-audio-status">STANDBY</span></div><canvas id="mm-audio-canvas"></canvas><div class="mm-audio-foot"><span>0 Hz</span><button id="mm-audio-enable" type="button">ENABLE FFT</button><span>12 kHz+</span></div>';
    var target=q('#mm-signal-module',p);if(target&&target.nextSibling)p.insertBefore(box,target.nextSibling);else p.appendChild(box);
    q('#mm-audio-enable',box).addEventListener('click',startAudioAnalyzer)
  }

  var analyser=null, fftFrame=0, fftTapGain=null;
  function startAudioAnalyzer(){
    var status=q('#mm-audio-status'), button=q('#mm-audio-enable');
    try{
      if(typeof audioEngine==='undefined'||!audioEngine||!audioEngine.audioContext){throw new Error('OpenWebRX AudioEngine not ready')}
      if(!audioEngine.isStarted || !audioEngine.isStarted()){
        audioEngine.resume();
        if(status)status.textContent='WAITING AUDIO';
        setTimeout(startAudioAnalyzer,600);
        return;
      }
      if(!analyser){
        analyser=audioEngine.audioContext.createAnalyser();
        analyser.fftSize=2048;
        analyser.smoothingTimeConstant=.78;
        analyser.minDecibels=-120;
        analyser.maxDecibels=-20;
        /* Passive tap from the real OpenWebRX gain node. The zero-gain branch
           keeps the analyser in the active audio graph without duplicating sound. */
        fftTapGain=audioEngine.audioContext.createGain();
        fftTapGain.gain.value=0;
        audioEngine.gainNode.connect(analyser);
        analyser.connect(fftTapGain);
        fftTapGain.connect(audioEngine.audioContext.destination);
      }
      audioEngine.audioContext.resume();
      if(status)status.textContent='LIVE';
      if(button){button.textContent='FFT ACTIVE';button.disabled=true}
      drawAudio();
    }catch(e){
      if(status)status.textContent='AUDIO NOT READY';
      if(button){button.disabled=false;button.textContent='RETRY FFT'}
      console.warn('Max Mountain FFT:',e);
    }
  }
  function drawAudio(){
    if(!analyser)return;
    cancelAnimationFrame(fftFrame);
    var canvas=q('#mm-audio-canvas'),ctx=canvas&&canvas.getContext('2d');if(!ctx)return;
    var data=new Uint8Array(analyser.frequencyBinCount);
    function frame(){
      var rect=canvas.getBoundingClientRect(),dpr=Math.max(1,window.devicePixelRatio||1);
      var w=Math.max(20,Math.floor(rect.width*dpr)),h=Math.max(20,Math.floor(rect.height*dpr));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
      analyser.getByteFrequencyData(data);
      ctx.clearRect(0,0,w,h);
      ctx.strokeStyle='rgba(92,255,128,.14)';ctx.lineWidth=Math.max(1,dpr*.6);
      for(var gx=1;gx<8;gx++){var x=w*gx/8;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
      for(var gy=1;gy<5;gy++){var y=h*gy/5;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
      var maxBin=Math.max(32,Math.min(data.length,Math.floor(12000/(audioEngine.audioContext.sampleRate/2)*data.length)));
      ctx.beginPath();
      for(var i=0;i<maxBin;i++){
        var xx=i/(maxBin-1)*w;
        var yy=h-(data[i]/255)*(h-4)-2;
        if(i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy)
      }
      ctx.strokeStyle='#83ff83';ctx.lineWidth=Math.max(1.2,dpr);ctx.stroke();
      var fill=ctx.createLinearGradient(0,0,0,h);fill.addColorStop(0,'rgba(157,255,171,.42)');fill.addColorStop(1,'rgba(61,221,104,.02)');
      ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fillStyle=fill;ctx.fill();
      fftFrame=requestAnimationFrame(frame)
    }
    frame()
  }

  function removeUIKit(){qa('.uikit-panel,.uikit-modal,[data-panel-name="uikit"],[id*="uikit" i],.ui-kit-settings,.openwebrx-tuning-knob,.tuning-knob-container,.frequency-knob-container,.floating-tuner,.floating-panel,[class*="thumbtune" i],[id*="thumbtune" i]').forEach(function(e){e.remove()})}
  function clock(){var e=q('#mm-utc-clock');if(e)e.textContent=new Date().toISOString().slice(11,19)+' UTC'}
  function forceResize(){window.dispatchEvent(new Event('resize'))}
  function init(){retitle();var tries=0,t=setInterval(function(){tries++;if(buildWorkspace()||tries>80){clearInterval(t);pinReceiver();normalizeButtons()}},100);removeUIKit();clock();setInterval(clock,1000);setInterval(function(){pinReceiver();removeUIKit()},1200);document.body.classList.add('mm-console-v52');setTimeout(forceResize,250);setTimeout(forceResize,1200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init()
})();
