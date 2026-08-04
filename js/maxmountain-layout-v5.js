(function(){
  'use strict';
  function q(s,r){return (r||document).querySelector(s)}
  function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function make(tag,id,cls){var e=document.createElement(tag);if(id)e.id=id;if(cls)e.className=cls;return e}
  function retitle(){document.title='Max Mountain Station | Tactical SDR Console v5';var t=q('.webrx-rx-title');if(t)t.textContent='MAX MOUNTAIN STATION'}
  function visible(el){var s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&el.offsetParent!==null}
  function buildWorkspace(){
    if(q('#mm-workspace'))return;
    var page=q('#webrx-page-container'), waterfall=q('.openwebrx-waterfall-container');
    var left=q('#openwebrx-panels-container-left'), right=q('#openwebrx-panels-container-right');
    var buttons=q('.openwebrx-main-buttons');
    if(!page||!waterfall||!left||!right||!buttons)return;
    var ws=make('main','mm-workspace');
    var rail=make('nav','mm-command-rail');
    var railHead=make('div','mm-command-head');railHead.textContent='COMMAND';
    var railScroll=make('div','mm-command-scroll');
    var main=make('section','mm-main-column');
    var spec=make('section','mm-spectrum-slot');
    var dock=make('section','mm-decoder-dock');
    var side=make('aside','mm-sidebar');
    var sh=make('div','mm-sidebar-head');sh.innerHTML='<span>RX CONTROL DECK</span><span id="mm-utc-clock">--:--:-- UTC</span>';
    var analyzer=buildAudioAnalyzer();
    var scroll=make('div','mm-sidebar-scroll');
    page.appendChild(ws);ws.appendChild(rail);ws.appendChild(main);ws.appendChild(side);
    rail.appendChild(railHead);rail.appendChild(railScroll);railScroll.appendChild(buttons);
    main.appendChild(spec);main.appendChild(dock);spec.appendChild(waterfall);dock.appendChild(left);
    side.appendChild(sh);side.appendChild(analyzer);side.appendChild(scroll);scroll.appendChild(right);
    updateDock();
    new MutationObserver(function(){updateDock();normalizeButtons()}).observe(page,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
    normalizeButtons();
  }
  function normalizeButtons(){
    var buttons=q('.openwebrx-main-buttons');if(!buttons)return;
    qa('.button',buttons).forEach(function(b){b.removeAttribute('style');var txt=(b.textContent||'').replace(/\s+/g,' ').trim();if(txt)b.title=b.title||txt});
  }
  function updateDock(){var d=q('#mm-decoder-dock'),l=q('#openwebrx-panels-container-left');if(!d||!l)return;var any=qa(':scope > .openwebrx-panel',l).some(visible);d.classList.toggle('mm-empty',!any)}
  function addSignalModule(){
    var p=q('#openwebrx-panel-receiver');if(!p||q('#mm-signal-module'))return;
    var m=make('div','mm-signal-module');
    m.innerHTML='<div class="mm-sig-head"><span>RF SIGNAL LEVEL</span><span class="mm-sig-value">S -- / -- dB</span></div><div class="mm-sig-track"><div class="mm-sig-fill"></div></div><div class="mm-sig-scale"><span>S1</span><span>S3</span><span>S5</span><span>S7</span><span>S9</span><span>+40</span></div>';
    var f=q('.frequencies-container',p);if(f&&f.nextSibling)p.insertBefore(m,f.nextSibling);else p.appendChild(m);
    setInterval(function(){var text='';qa('.smeter-value,.s-meter-value,[data-smeter],.openwebrx-smeter-value').some(function(e){text=(e.textContent||'').trim();return !!text});var value=-105,mt=text.match(/-?\d+(?:\.\d+)?/);if(mt)value=parseFloat(mt[0]);var fill=q('.mm-sig-fill',m),val=q('.mm-sig-value',m);if(fill)fill.style.width=Math.max(3,Math.min(100,(value+120)/.7))+'%';if(val)val.textContent=text||'S -- / -- dB'},500)
  }
  function buildAudioAnalyzer(){
    var box=make('section','mm-audio-analyzer');
    box.innerHTML='<div class="mm-audio-head"><span>AUDIO SPECTRUM ANALYZER</span><span id="mm-audio-status">STANDBY</span></div><canvas id="mm-audio-canvas"></canvas><div class="mm-audio-foot"><span>0 Hz</span><button id="mm-audio-enable" type="button">ENABLE FFT</button><span>12 kHz+</span></div>';
    setTimeout(function(){var b=q('#mm-audio-enable',box);if(b)b.addEventListener('click',startAudioAnalyzer)},0);
    return box
  }
  var audioCtx=null,analyser=null,audioSource=null,fftFrame=0;
  function findAudio(){return q('audio')||q('#openwebrx-audio')||q('[data-audio-output]')}
  function startAudioAnalyzer(){
    var status=q('#mm-audio-status'),button=q('#mm-audio-enable'),audio=findAudio();
    if(!audio){if(status)status.textContent='NO AUDIO ELEMENT';return}
    try{
      if(!audioCtx){
        var AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw new Error('WebAudio unsupported');
        audioCtx=new AC();analyser=audioCtx.createAnalyser();analyser.fftSize=1024;analyser.smoothingTimeConstant=.72;
        audioSource=audioCtx.createMediaElementSource(audio);audioSource.connect(analyser);analyser.connect(audioCtx.destination)
      }
      audioCtx.resume();if(status)status.textContent='LIVE FFT';if(button)button.textContent='FFT ACTIVE';drawAudio()
    }catch(e){if(status)status.textContent='FFT UNAVAILABLE';console.warn('Max Mountain audio analyzer:',e)}
  }
  function drawAudio(){
    if(!analyser)return;cancelAnimationFrame(fftFrame);
    var canvas=q('#mm-audio-canvas'),ctx=canvas&&canvas.getContext('2d');if(!ctx)return;
    function frame(){
      var rect=canvas.getBoundingClientRect(),dpr=Math.max(1,window.devicePixelRatio||1),w=Math.max(10,Math.floor(rect.width*dpr)),h=Math.max(10,Math.floor(rect.height*dpr));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
      var data=new Uint8Array(analyser.frequencyBinCount);analyser.getByteFrequencyData(data);
      ctx.clearRect(0,0,w,h);ctx.strokeStyle='rgba(74,145,91,.18)';ctx.lineWidth=1;
      for(var gy=1;gy<4;gy++){var y=h*gy/4;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
      for(var gx=1;gx<8;gx++){var x=w*gx/8;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
      var bars=Math.min(72,Math.floor(w/4)),step=Math.max(1,Math.floor(data.length/bars));
      for(var i=0;i<bars;i++){var v=data[i*step]/255,bw=w/bars-1,bh=Math.max(1,v*(h-3)),x=i*w/bars;var g=ctx.createLinearGradient(0,h,0,0);g.addColorStop(0,'#35c95e');g.addColorStop(.72,'#ffd166');g.addColorStop(1,'#ff655f');ctx.fillStyle=g;ctx.fillRect(x,h-bh,bw,bh)}
      fftFrame=requestAnimationFrame(frame)
    }
    frame()
  }
  function removeUIKit(){qa('.uikit-panel,.uikit-modal,[data-panel-name="uikit"],[id*="uikit" i],.ui-kit-settings').forEach(function(e){e.remove()})}
  function clock(){var e=q('#mm-utc-clock');if(e)e.textContent=new Date().toISOString().slice(11,19)+' UTC'}
  function forceResize(){window.dispatchEvent(new Event('resize'))}
  function init(){retitle();buildWorkspace();addSignalModule();removeUIKit();clock();setInterval(clock,1000);setInterval(removeUIKit,2500);document.body.classList.add('mm-console-v5');setTimeout(forceResize,180);setTimeout(forceResize,950);if(window.ResizeObserver){new ResizeObserver(forceResize).observe(q('#mm-workspace'))}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init()
})();
