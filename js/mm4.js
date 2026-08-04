(function(){
  'use strict';
  function q(s,r){return (r||document).querySelector(s)}
  function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function make(tag,id,cls){var e=document.createElement(tag);if(id)e.id=id;if(cls)e.className=cls;return e}
  function retitle(){document.title='Max Mountain Station | Tactical SDR Console';var t=q('.webrx-rx-title');if(t)t.textContent='MAX MOUNTAIN STATION';}
  function buildWorkspace(){
    if(q('#mm-workspace'))return;
    var page=q('#webrx-page-container'), waterfall=q('.openwebrx-waterfall-container');
    var left=q('#openwebrx-panels-container-left'), right=q('#openwebrx-panels-container-right');
    if(!page||!waterfall||!left||!right)return;
    var ws=make('main','mm-workspace'), main=make('section','mm-main-column'), spec=make('section','mm-spectrum-slot');
    var dock=make('section','mm-decoder-dock'), side=make('aside','mm-sidebar');
    var sh=make('div','mm-sidebar-head');sh.innerHTML='<span>RX CONTROL DECK</span><span id="mm-utc-clock">--:--:-- UTC</span>';
    var scroll=make('div','mm-sidebar-scroll');
    page.appendChild(ws);ws.appendChild(main);ws.appendChild(side);main.appendChild(spec);main.appendChild(dock);side.appendChild(sh);side.appendChild(scroll);
    spec.appendChild(waterfall);dock.appendChild(left);scroll.appendChild(right);
    sh.addEventListener('click',function(){if(innerWidth<=820)side.classList.toggle('mm-collapsed')});
    updateDock();
    new MutationObserver(updateDock).observe(left,{attributes:true,subtree:true,attributeFilter:['style','class']});
  }
  function visible(el){var s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&el.offsetParent!==null}
  function updateDock(){var d=q('#mm-decoder-dock'),l=q('#openwebrx-panels-container-left');if(!d||!l)return;var any=qa(':scope > .openwebrx-panel',l).some(visible);d.classList.toggle('mm-empty',!any)}
  function addSignalModule(){var p=q('#openwebrx-panel-receiver');if(!p||q('#mm-signal-module'))return;var m=make('div','mm-signal-module');m.innerHTML='<div class="mm-sig-head"><span>RF SIGNAL LEVEL</span><span class="mm-sig-value">S -- / -- dB</span></div><div class="mm-sig-track"><div class="mm-sig-fill"></div></div><div class="mm-sig-scale"><span>S1</span><span>S3</span><span>S5</span><span>S7</span><span>S9</span><span>+40</span></div>';var f=q('.frequencies-container',p);if(f&&f.nextSibling)p.insertBefore(m,f.nextSibling);else p.appendChild(m);setInterval(function(){var text='';qa('.smeter-value,.s-meter-value,[data-smeter],.openwebrx-smeter-value').some(function(e){text=(e.textContent||'').trim();return !!text});var value=-105,mt=text.match(/-?\d+(?:\.\d+)?/);if(mt)value=parseFloat(mt[0]);var fill=q('.mm-sig-fill',m),val=q('.mm-sig-value',m);if(fill)fill.style.width=Math.max(3,Math.min(100,(value+120)/.7))+'%';if(val)val.textContent=text||'S -- / -- dB'},500)}
  function removeUIKit(){qa('.uikit-panel,.uikit-modal,[data-panel-name="uikit"],[id*="uikit" i],.ui-kit-settings').forEach(function(e){e.remove()});qa('*').filter(function(e){return /^UI Kit Settings$/i.test((e.textContent||'').trim())}).forEach(function(e){var p=e.closest('.openwebrx-panel,.uikit-panel')||e;p.remove()})}
  function clock(){var e=q('#mm-utc-clock');if(e)e.textContent=new Date().toISOString().slice(11,19)+' UTC'}
  function resize(){window.dispatchEvent(new Event('resize'))}
  function init(){retitle();buildWorkspace();addSignalModule();removeUIKit();clock();setInterval(clock,1000);setInterval(removeUIKit,2500);document.body.classList.add('mm-console-v4');setTimeout(resize,150);setTimeout(resize,900)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
