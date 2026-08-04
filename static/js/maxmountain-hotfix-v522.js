(function(){
  'use strict';
  var FLOATING_SELECTORS=[
    '.openwebrx-tuning-knob','.tuning-knob-container','.frequency-knob-container',
    '.floating-tuner','.floating-tuner-panel','.thumbtune','.thumb-tune',
    '[class*="thumbtune" i]','[id*="thumbtune" i]',
    '[data-plugin*="thumbtune" i]','[data-plugin-name*="thumb" i]'
  ].join(',');

  function removeDuplicateTuner(root){
    var scope=root&&root.querySelectorAll?root:document;
    scope.querySelectorAll(FLOATING_SELECTORS).forEach(function(el){el.remove();});
    /* Fallback for the known bottom-left tuning widget: only remove fixed dialogs
       containing an SDR profile title plus large tuning arrows. */
    scope.querySelectorAll('[role="dialog"],.plugin-panel,.openwebrx-plugin-panel').forEach(function(el){
      var text=(el.textContent||'').replace(/\s+/g,' ').trim();
      var cs=getComputedStyle(el);
      if((cs.position==='fixed'||cs.position==='absolute') && /RTL-SDR|MHz/.test(text) && /1k/.test(text) && text.length<220){el.remove();}
    });
  }

  function repairHeader(){
    document.title='Max Mountain Station | Tactical SDR Console';
    var title=document.querySelector('.webrx-rx-title');
    if(title){title.textContent='MAX MOUNTAIN STATION';title.title='MAX MOUNTAIN STATION';}
    var desc=document.querySelector('.webrx-rx-desc');
    if(desc && !desc.dataset.mm522){
      desc.dataset.mm522='1';
      var original=(desc.textContent||'').trim();
      desc.textContent='TACTICAL SDR RECEIVER'+(original?' • '+original:'');
    }
  }

  function markActions(){
    document.querySelectorAll('.openwebrx-record-button').forEach(function(el){el.title='Record audio';});
  }

  function run(){repairHeader();markActions();removeDuplicateTuner(document);}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  /* Child additions only: no class/style observation and therefore no mutation loop. */
  var observer=new MutationObserver(function(records){
    records.forEach(function(r){r.addedNodes.forEach(function(n){if(n.nodeType===1)removeDuplicateTuner(n);});});
    window.clearTimeout(window.__mm522HeaderTimer);
    window.__mm522HeaderTimer=window.setTimeout(function(){repairHeader();markActions();},80);
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.setInterval(run,2500);
})();
