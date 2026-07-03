(function(){
  const railSelector=".report-rail-item";
  const sectionSelector=".report-section-card[id]";
  const body=document.getElementById("reportBody");
  let queued=false;

  function slug(value){return String(value||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}

  function injectDensity(){
    if(document.getElementById("reportDensityStylesheet"))return;
    const link=document.createElement("link");
    link.id="reportDensityStylesheet";
    link.rel="stylesheet";
    link.href="./report-density.css?v=compact-report-20260703";
    document.head.append(link);
  }

  function activeSection(){
    const sections=Array.from(document.querySelectorAll(sectionSelector));
    if(!sections.length)return null;
    const anchor=Math.min(250,Math.max(120,window.innerHeight*.26));
    let active=sections[0];
    for(const section of sections){
      const rect=section.getBoundingClientRect();
      if(rect.top<=anchor&&rect.bottom>90)active=section;
      if(rect.top>anchor)break;
    }
    return active;
  }

  function syncRail(){
    const section=activeSection();
    if(!section)return;
    const raw=slug(section.dataset.reportSectionId||section.id||"");
    const dom=slug(section.id||"");
    document.querySelectorAll(railSelector).forEach(function(item){
      const itemId=slug(item.dataset.reportSectionId||item.getAttribute("href")||"");
      const itemHref=slug(String(item.getAttribute("href")||"").replace(/^#/,""));
      const active=itemId===raw||itemId===dom||itemHref===raw||itemHref===dom;
      item.classList.toggle("active",active);
      item.setAttribute("aria-current",active?"true":"false");
    });
  }

  function classifyCards(){
    document.querySelectorAll(".report-finding-layout").forEach(function(layout){
      const panels=layout.querySelectorAll(":scope > .report-context-panel");
      layout.classList.toggle("single-panel",panels.length===1);
      layout.classList.toggle("two-panels",panels.length===2);
      layout.classList.toggle("multi-panel",panels.length>2);
      layout.classList.add("row-flow");
    });
  }

  function syncDeckFooters(){
    document.querySelectorAll(".report-card-deck[data-report-deck-id]").forEach(function(deck){
      if(deck.querySelector(":scope > .report-deck-footer"))return;
      const headerActions=deck.querySelector(":scope > .report-deck-header .report-deck-actions");
      if(!headerActions)return;
      const footer=document.createElement("div");
      footer.className="report-deck-footer";
      const cloned=headerActions.cloneNode(true);
      cloned.classList.add("report-deck-actions-bottom");
      footer.append(cloned);
      deck.append(footer);
    });
  }

  function run(){
    queued=false;
    injectDensity();
    classifyCards();
    syncDeckFooters();
    syncRail();
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(run);
  }

  window.addEventListener("scroll",schedule,{passive:true});
  window.addEventListener("resize",schedule,{passive:true});
  window.addEventListener("load",schedule);
  document.addEventListener("DOMContentLoaded",schedule);
  if(body&&"MutationObserver"in window)new MutationObserver(schedule).observe(body,{childList:true,subtree:true});
  setTimeout(schedule,250);
  setTimeout(schedule,1000);
})();
