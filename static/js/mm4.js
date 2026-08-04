(function(){
  'use strict';

  function q(s,r){return (r||document).querySelector(s)}
  function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function make(tag,id,cls){var e=document.createElement(tag);if(id)e.id=id;if(cls)e.className=cls;return e}

  function retitle(){
    document.title='Max Mountain Station | Tactical SDR Console';
    var t=q('.webrx-rx-title');
    if(t)t.textContent="MAX'S MOUNTAINS STATION VHF - UHF";
  }

  function buildWorkspace(){
    if(q('#mm-workspace'))return true;
    var page=q('#webrx-page-container');
    var waterfall=q('.openwebrx-waterfall-container');
    var left=q('#openwebrx-panels-container-left');
    var right=q('#openwebrx-panels-container-right');
    if(!page||!waterfall||!left||!right)return false;

    var ws=make('main','mm-workspace');
    var main=make('section','mm-main-column');
    var spec=make('section','mm-spectrum-slot');
    var dock=make('section','mm-decoder-dock');
    var side=make('aside','mm-sidebar');
    var sh=make('div','mm-sidebar-head');
    var scroll=make('div','mm-sidebar-scroll');

    sh.innerHTML='<span>RX CONTROL DECK</span><span id="mm-utc-clock">--:--:-- UTC</span>';
    page.appendChild(ws);ws.appendChild(main);ws.appendChild(side);
    main.appendChild(spec);main.appendChild(dock);
    side.appendChild(sh);side.appendChild(scroll);
    spec.appendChild(waterfall);dock.appendChild(left);scroll.appendChild(right);

    updateDock();
    new MutationObserver(updateDock).observe(left,{childList:true,subtree:true});
    return true;
  }

  function visible(el){
    var s=getComputedStyle(el);
    return s.display!=='none'&&s.visibility!=='hidden'&&el.offsetParent!==null;
  }

  function updateDock(){
    var d=q('#mm-decoder-dock');
    var l=q('#openwebrx-panels-container-left');
    if(!d||!l)return;
    var any=qa(':scope > .openwebrx-panel',l).some(visible);
    d.classList.toggle('mm-empty',!any);
  }

  function ensureReceiver(){
    var p=q('#openwebrx-panel-receiver');
    var right=q('#openwebrx-panels-container-right');
    if(!p)return;
    p.style.display='block';
    p.style.visibility='visible';
    if(right&&p.parentNode!==right)right.insertBefore(p,right.firstChild);
  }

  function removeFloating(){
    var sels=[
      '#openwebrx-thumbtune','#thumbtune','#thumb-tune','#tune-precise-panel',
      '#openwebrx-tune-precise','.thumbtune','.thumb-tune','.thumb-tune-panel',
      '.openwebrx-thumbtune','.tune-precise-panel','.floating-tuning-panel',
      '.floating-tuner','.openwebrx-floating-panel','[data-plugin="thumbtune"]',
      '[data-plugin="tune_precise"]','[data-panel-name*="thumb" i]'
    ];
    qa(sels.join(',')).forEach(function(e){e.remove()});
  }

  function removeSatellitePluginUI(){
    qa('[data-plugin*="sat" i],[data-panel-name*="sat" i],[title*="sat finder" i],[title*="sat id" i],[title="Track" i],.sat-finder,.satfinder,.sat-id,.sat-track')
      .forEach(function(e){e.remove()});
  }

  function moveNativeSmeter(){
    var receiver=q('#openwebrx-panel-receiver');
    var meter=q('#openwebrx-smeter');
    var db=q('#openwebrx-smeter-db');
    if(!receiver||!meter||!db)return;

    var box=q('#mm-native-smeter');
    if(!box){
      box=make('section','mm-native-smeter');
      box.innerHTML='<div class="mm-module-title"><span>RF SIGNAL LEVEL</span><span class="mm-native-smeter-value"></span></div><div class="mm-native-smeter-body"></div><div class="mm-native-smeter-scale"><span>S1</span><span>S3</span><span>S5</span><span>S7</span><span>S9</span><span>+40</span></div>';
      var freq=q('.frequencies-container',receiver);
      if(freq&&freq.nextSibling)receiver.insertBefore(box,freq.nextSibling);else receiver.insertBefore(box,receiver.firstChild);
    }
    var body=q('.mm-native-smeter-body',box);
    var value=q('.mm-native-smeter-value',box);
    if(meter.parentNode!==body)body.appendChild(meter);
    if(db.parentNode!==value)value.appendChild(db);
  }

  function getNativeModeElements(){
    var host=q('#openwebrx-panel-receiver .openwebrx-modes');
    if(!host)return null;
    var grid=q('.openwebrx-modes-grid',host);
    var analog=grid?qa('.openwebrx-demodulator-button[data-modulation]',grid):[];
    var digSelect=q('.openwebrx-secondary-demod-listbox',host);
    var digToggle=q('.openwebrx-button-dig',host);
    return {host:host,grid:grid,analog:analog,digSelect:digSelect,digToggle:digToggle};
  }

  function digitalOptions(select){
    if(!select)return [];
    return qa('option',select).filter(function(o){
      var value=(o.value||'').trim();
      var text=(o.textContent||'').trim();
      return !o.disabled&&value&&value!=='none'&&text;
    });
  }

  function clickDigital(select,value){
    select.value=value;
    select.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function buildModeDeck(){
    var n=getNativeModeElements();
    if(!n||!n.grid||!n.digSelect)return;

    var signature=n.analog.map(function(b){return (b.dataset.modulation||'')+'='+(b.textContent||'').trim()}).join('|')+
      '||'+digitalOptions(n.digSelect).map(function(o){return o.value+'='+(o.textContent||'').trim()}).join('|');

    var deck=q('#mm-mode-deck',n.host);
    if(deck&&deck.dataset.signature===signature){syncModeDeck();return;}
    if(deck)deck.remove();

    deck=make('div','mm-mode-deck');
    deck.dataset.signature=signature;

    var voice=make('section',null,'mm-mode-section');
    var voiceTitle=make('div',null,'mm-mode-title');
    var voiceKeys=make('div',null,'mm-mode-grid mm-mode-grid-voice');
    voiceTitle.textContent='VOICE MODES';

    n.analog.forEach(function(nativeButton){
      var b=make('button',null,'mm-mode-key');
      b.type='button';
      b.textContent=(nativeButton.textContent||nativeButton.dataset.modulation||'').trim();
      b.dataset.kind='voice';
      b.dataset.modulation=nativeButton.dataset.modulation||'';
      b.addEventListener('click',function(){nativeButton.click();setTimeout(syncModeDeck,30)});
      voiceKeys.appendChild(b);
    });
    voice.appendChild(voiceTitle);voice.appendChild(voiceKeys);

    var digi=make('section',null,'mm-mode-section');
    var digiTitle=make('div',null,'mm-mode-title');
    var digiKeys=make('div',null,'mm-mode-grid mm-mode-grid-digi');
    digiTitle.textContent='DIGI MODES';

    digitalOptions(n.digSelect).forEach(function(opt){
      var b=make('button',null,'mm-mode-key');
      b.type='button';
      b.textContent=(opt.textContent||opt.value).trim();
      b.dataset.kind='digi';
      b.dataset.modulation=opt.value;
      b.addEventListener('click',function(){clickDigital(n.digSelect,opt.value);setTimeout(syncModeDeck,30)});
      digiKeys.appendChild(b);
    });

    var scanner=make('button','mm-scanner-button','mm-mode-key mm-scanner-button');
    scanner.type='button';scanner.textContent='SCANNER';
    scanner.addEventListener('click',function(){
      var nativeScanner=q('#openwebrx-panel-receiver .openwebrx-squelch-auto');
      if(nativeScanner)nativeScanner.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,view:window}));
    });
    digiKeys.appendChild(scanner);
    digi.appendChild(digiTitle);digi.appendChild(digiKeys);

    deck.appendChild(voice);deck.appendChild(digi);
    n.host.appendChild(deck);
    n.digSelect.addEventListener('change',syncModeDeck);
    syncModeDeck();
  }

  function syncModeDeck(){
    var n=getNativeModeElements();
    var deck=q('#mm-mode-deck');
    if(!n||!deck)return;

    var activeAnalog='';
    n.analog.some(function(b){
      var c=b.classList;
      if(c.contains('highlighted')||c.contains('active')||c.contains('selected')){
        activeAnalog=b.dataset.modulation||'';return true;
      }
      return false;
    });
    var activeDigi=n.digSelect?n.digSelect.value:'';

    qa('.mm-mode-key[data-kind="voice"]',deck).forEach(function(b){
      b.classList.toggle('mm-active',b.dataset.modulation===activeAnalog&&!activeDigi);
    });
    qa('.mm-mode-key[data-kind="digi"]',deck).forEach(function(b){
      b.classList.toggle('mm-active',b.dataset.modulation===activeDigi&&activeDigi!=='none');
    });
  }

  function addAudioAnalyzer(){
    var receiver=q('#openwebrx-panel-receiver');
    if(!receiver||q('#mm-audio-module'))return;

    var box=make('section','mm-audio-module');
    box.innerHTML='<div class="mm-module-title"><span>AUDIO SPECTRUM</span><span id="mm-audio-state">WAITING AUDIO</span></div><canvas id="mm-audio-canvas" width="720" height="210"></canvas><div id="mm-audio-scale"><span>0</span><span>5 kHz</span><span>10 kHz</span><span>15 kHz</span><span>20 kHz</span></div>';

    var modesSection=q('#openwebrx-section-controls',receiver);
    if(modesSection)receiver.insertBefore(box,modesSection);else receiver.appendChild(box);

    var canvas=q('#mm-audio-canvas',box);
    var ctx=canvas.getContext('2d');
    var analyser=null,data=null,node=null;

    function connect(){
      if(analyser)return true;
      try{
        if(!window.audioEngine||!audioEngine.audioContext)return false;
        node=audioEngine.gainNode||audioEngine.audioNode;
        if(!node)return false;
        analyser=audioEngine.audioContext.createAnalyser();
        analyser.fftSize=4096;
        analyser.smoothingTimeConstant=.74;
        analyser.minDecibels=-115;
        analyser.maxDecibels=-15;
        node.connect(analyser);
        data=new Uint8Array(analyser.frequencyBinCount);
        return true;
      }catch(e){analyser=null;data=null;node=null;return false;}
    }

    function drawGrid(w,h){
      ctx.fillStyle='#020403';ctx.fillRect(0,0,w,h);
      ctx.strokeStyle='rgba(66,217,104,.12)';ctx.lineWidth=1;
      for(var gx=0;gx<=4;gx++){
        var x=gx*w/4;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();
      }
      for(var gy=0;gy<=5;gy++){
        var y=gy*h/5;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();
      }
    }

    function draw(){
      requestAnimationFrame(draw);
      var w=canvas.width,h=canvas.height,state=q('#mm-audio-state',box);
      drawGrid(w,h);
      if(!connect()){if(state)state.textContent='WAITING AUDIO';return;}
      try{analyser.getByteFrequencyData(data)}catch(e){analyser=null;data=null;node=null;return;}

      var sampleRate=audioEngine.audioContext.sampleRate||44100;
      var nyquist=sampleRate/2;
      var maxHz=Math.min(20000,nyquist);
      var bins=Math.max(2,Math.min(data.length,Math.floor((maxHz/nyquist)*data.length)));
      if(state)state.textContent=(audioEngine.audioContext.state==='running'?'LIVE ':'PAUSED ')+Math.round(maxHz/1000)+' kHz';

      ctx.beginPath();
      for(var i=0;i<bins;i++){
        var xx=i/(bins-1)*w;
        var yy=h-(data[i]/255)*(h-8)-4;
        if(i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);
      }
      ctx.strokeStyle='#91ff9d';ctx.lineWidth=2;
      ctx.shadowColor='rgba(145,255,157,.45)';ctx.shadowBlur=5;ctx.stroke();ctx.shadowBlur=0;
    }
    draw();
  }

  function polishDisplay(){
    var receiver=q('#openwebrx-panel-receiver');
    if(!receiver)return;

    qa('.openwebrx-record-button',receiver).forEach(function(e){
      e.textContent='REC';e.classList.add('mm-display-text-button');
    });

    qa('[title*="picture" i],[title*="screenshot" i]',receiver).forEach(function(e){
      e.classList.add('mm-display-text-button','mm-picture-button');
      e.textContent='PICTURE';
    });
  }

  function clock(){
    var e=q('#mm-utc-clock');
    if(e)e.textContent=new Date().toISOString().slice(11,19)+' UTC';
  }

  function resize(){window.dispatchEvent(new Event('resize'))}

  function applyFixes(){
    retitle();removeFloating();removeSatellitePluginUI();ensureReceiver();
    moveNativeSmeter();buildModeDeck();syncModeDeck();polishDisplay();
  }

  function init(){
    retitle();document.body.classList.add('mm-console-v4','mm-console-v433');
    var tries=0;
    var timer=setInterval(function(){
      tries++;
      if(buildWorkspace()||tries>60){
        clearInterval(timer);
        ensureReceiver();moveNativeSmeter();buildModeDeck();addAudioAnalyzer();polishDisplay();
        setTimeout(resize,150);setTimeout(resize,900);
      }
    },100);

    clock();setInterval(clock,1000);
    setInterval(applyFixes,1800);

    var pending=false;
    new MutationObserver(function(list){
      var added=list.some(function(m){return m.addedNodes&&m.addedNodes.length;});
      if(added&&!pending){
        pending=true;
        setTimeout(function(){pending=false;applyFixes();},90);
      }
    }).observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
