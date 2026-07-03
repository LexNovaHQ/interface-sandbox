(function(){
  const railRoot=document.getElementById("reportRail");
  const body=document.getElementById("reportBody");
  const sectionSelector=".report-section-card[id]";
  let queued=false;

  function slug(value){return String(value||"section").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"section";}

  function injectStyles(){
    if(document.getElementById("reportRailSubsectionStyles"))return;
    const style=document.createElement("style");
    style.id="reportRailSubsectionStyles";
    style.textContent=".report-rail-section{border-radius:12px}.report-rail-section .report-rail-sublist{display:none;margin:.18rem 0 .42rem 41px;padding-left:.6rem;border-left:1px solid rgba(20,28,45,.14)}.report-rail-section.expanded .report-rail-sublist{display:grid;gap:3px}.report-rail-subitem{display:block;padding:.34rem .42rem;border-radius:8px;color:#475467;text-decoration:none;font-size:.58rem;line-height:1.22;letter-spacing:.045em;text-transform:uppercase}.report-rail-subitem:hover{background:rgba(15,23,42,.045);color:#101828}.report-rail-subitem.active{background:rgba(15,23,42,.08);color:#101828;font-weight:760}.report-rail-section.expanded>.report-rail-item{background:rgba(15,23,42,.055)}@media(max-width:980px){.report-rail-section .report-rail-sublist{margin-left:34px}.report-rail-subitem{font-size:.56rem}}";
    document.head.append(style);
  }

  function enhanceRail(){
    if(!railRoot)return;
    const list=railRoot.querySelector(".report-rail-list");
    if(!list)return;
    const sections=Array.from(document.querySelectorAll(sectionSelector));
    if(!sections.length)return;
    injectStyles();
    const sectionLinks=Array.from(list.querySelectorAll(":scope > .report-rail-item, :scope > .report-rail-section > .report-rail-item"));
    sections.forEach(function(section,index){
      const sectionId=section.id||slug(section.dataset.reportSectionId||"section-"+index);
      const link=sectionLinks.find(function(item){return slug(item.dataset.reportSectionId||item.getAttribute("href")||"")===slug(section.dataset.reportSectionId||sectionId)||item.getAttribute("href")==="#"+sectionId;})||sectionLinks[index];
      if(!link)return;
      let wrapper=link.closest(".report-rail-section");
      if(!wrapper){
        wrapper=document.createElement("div");
        wrapper.className="report-rail-section";
        link.before(wrapper);
        wrapper.append(link);
      }
      wrapper.dataset.reportSectionId=sectionId;
      link.setAttribute("aria-expanded",wrapper.classList.contains("expanded")?"true":"false");
      let sublist=wrapper.querySelector(":scope > .report-rail-sublist");
      if(!sublist){
        sublist=document.createElement("div");
        sublist.className="report-rail-sublist";
        wrapper.append(sublist);
      }
      sublist.replaceChildren();
      Array.from(section.querySelectorAll(":scope > .law-subsection")).forEach(function(subsection,subIndex){
        const heading=subsection.querySelector("h3");
        const title=(heading&&heading.textContent||"Subsection "+(subIndex+1)).trim();
        const id=sectionId+"__"+slug(title)+"-"+String(subIndex+1).padStart(2,"0");
        subsection.id=id;
        subsection.dataset.reportParentSectionId=sectionId;
        subsection.dataset.reportSubsectionId=id;
        const a=document.createElement("a");
        a.className="report-rail-subitem";
        a.href="#"+id;
        a.dataset.reportParentSectionId=sectionId;
        a.dataset.reportSubsectionId=id;
        a.textContent=title;
        sublist.append(a);
      });
    });
    syncRailState();
  }

  function activeBlock(nodes,anchor){
    if(!nodes.length)return null;
    let active=nodes[0];
    for(const node of nodes){
      const rect=node.getBoundingClientRect();
      if(rect.top<=anchor&&rect.bottom>90)active=node;
      if(rect.top>anchor)break;
    }
    return active;
  }

  function syncRailState(){
    const sections=Array.from(document.querySelectorAll(sectionSelector));
    if(!sections.length)return;
    const anchor=Math.min(250,Math.max(120,window.innerHeight*.26));
    const activeSection=activeBlock(sections,anchor);
    const activeSectionId=activeSection?(activeSection.id||slug(activeSection.dataset.reportSectionId||"")):"";
    const subsections=activeSection?Array.from(activeSection.querySelectorAll(":scope > .law-subsection[id]")):[];
    const activeSub=activeBlock(subsections,anchor);
    const activeSubId=activeSub?activeSub.id:"";
    document.querySelectorAll(".report-rail-section").forEach(function(wrapper){
      const expanded=slug(wrapper.dataset.reportSectionId||"")===slug(activeSectionId);
      wrapper.classList.toggle("expanded",expanded);
      wrapper.classList.toggle("active-section",expanded);
      const top=wrapper.querySelector(":scope > .report-rail-item");
      if(top)top.setAttribute("aria-expanded",expanded?"true":"false");
    });
    document.querySelectorAll(".report-rail-subitem").forEach(function(item){
      const active=item.dataset.reportSubsectionId===activeSubId;
      item.classList.toggle("active",active);
      item.setAttribute("aria-current",active?"location":"false");
    });
  }

  function run(){queued=false;enhanceRail();syncRailState();}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(run);}

  window.addEventListener("scroll",schedule,{passive:true});
  window.addEventListener("resize",schedule,{passive:true});
  window.addEventListener("load",schedule);
  document.addEventListener("DOMContentLoaded",schedule);
  if(body&&"MutationObserver"in window)new MutationObserver(schedule).observe(body,{childList:true,subtree:true});
  setTimeout(schedule,250);
  setTimeout(schedule,1000);
})();
