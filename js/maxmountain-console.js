(function(){
  'use strict';
  function q(s,r){return (r||document).querySelector(s)}
  function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function togglePanel(id){var el=document.getElementById(id); if(!el)return; el.style.display=(getComputedStyle(el).display==='none')?'block':'none';}
  function make(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
  function buildRail(){
    if(q('#mm-command-rail'))return;
    var rail=make('aside');rail.id='mm-command-rail';
    var mark=make('div','mm-rail-mark');mark.innerHTML='<span class="mm-rail-led"></span><br>MMS<br>RX NODE';rail.appendChild(mark);
    [['RX CTRL','openwebrx-panel-receiver'],['DAB MON','openwebrx-panel-metadata-dab'],['STATUS','openwebrx-panel-status'],['LOG','openwebrx-panel-log']].forEach(function(x){var b=make('button','mm-rail-btn',x[0]);b.onclick=function(){togglePanel(x[1])};rail.appendChild(b)});
    var scan=make('button','mm-rail-btn','SCAN');scan.onclick=function(){var n=q('[title*="scan" i],.scanner-button,.openwebrx-scan-button');if(n)n.click()};rail.appendChild(scan);
    rail.appendChild(make('div','mm-rail-spacer'));
    var utc=make('div','mm-utc','00:00:00 UTC');utc.id='mm-utc-clock';rail.appendChild(utc);
    q('#webrx-page-container').appendChild(rail);
  }
  function addSignalModule(){
    var p=q('#openwebrx-panel-receiver');if(!p||q('#mm-signal-module'))return;
    var m=make('div');m.id='mm-signal-module';m.innerHTML='<div class="mm-sig-head"><span>RF SIGNAL LEVEL</span><span class="mm-sig-value">S -- / -- dB</span></div><div class="mm-sig-track"><div class="mm-sig-fill"></div></div><div class="mm-sig-scale"><span>S1</span><span>S3</span><span>S5</span><span>S7</span><span>S9</span><span>+40</span></div>';
    var first=q('.frequencies-container',p); if(first&&first.nextSibling)p.insertBefore(m,first.nextSibling);else p.appendChild(m);
    setInterval(function(){
      var candidates=qa('.smeter-value,.s-meter-value,[data-smeter],.openwebrx-smeter-value');var text='';candidates.some(function(e){text=(e.textContent||'').trim();return !!text});
      var value=-105;var mt=text.match(/-?\d+(?:\.\d+)?/);if(mt)value=parseFloat(mt[0]);
      var pct=Math.max(3,Math.min(100,(value+120)/.7));q('.mm-sig-fill',m).style.width=pct+'%';q('.mm-sig-value',m).textContent=text||'S -- / -- dB';
    },500);
  }
  function addMobile(){var b=make('button','mm-mobile-console mm-rail-btn','CTRL');b.style.cssText='display:none;position:fixed;right:10px;bottom:10px;z-index:100;width:62px';b.onclick=function(){document.body.classList.toggle('mm-console-open')};document.body.appendChild(b)}
  function retitle(){document.title='Max Mountain Station | Tactical SDR Console';var title=q('.webrx-rx-title');if(title&&!/MAX MOUNTAIN/i.test(title.textContent))title.textContent='MAX MOUNTAIN STATION';}
  function clock(){var e=q('#mm-utc-clock');if(e)e.textContent=new Date().toISOString().slice(11,19)+' UTC'}
  function init(){retitle();buildRail();addSignalModule();addMobile();clock();setInterval(clock,1000);document.body.classList.add('mm-console-v3')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
