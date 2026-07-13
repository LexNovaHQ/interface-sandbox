(function(){
"use strict";
const VERSION="interface_assembly_preview.v1";
const runId=new URLSearchParams(location.search||"").get("run_id")||"";
const endpoint=runId?`/public/diligence-system/qualified-review/${encodeURIComponent(runId)}`:"";
const families=[
{id:"terms",title:"Terms and Customer Agreements",copy:"Future customer-facing terms, service agreements and commercial allocation drafts."},
{id:"privacy",title:"Privacy and Data Documents",copy:"Future privacy notices, data-processing terms and related data-governance drafts."},
{id:"ai",title:"AI Governance Documents",copy:"Future AI policy, acceptable-use, governance and review-control drafts."},
{id:"vendor",title:"Vendor and Processor Documents",copy:"Future processor, vendor, partner and supply-chain documentation."},
{id:"internal",title:"Internal Governance Pack",copy:"Future internal controls, SOPs, review matrices and escalation documentation."},
{id:"commercial",title:"Commercial Support Documents",copy:"Future SLA, support, service-credit and operational commitment drafts."}
];
const els={summary:byId("assemblyMatterSummary"),state:byId("assemblyOverallState"),families:byId("assemblyFamilyGrid"),ready:byId("assemblyReadiness"),blocked:byId("assemblyBlockedState"),live:byId("assemblyLiveStatus")};
window.InterfaceAssemblyPreview=Object.freeze({version:VERSION,preview_only:true,backend_active:false,requires_qualified_review:true,no_fake_generation:true});
renderFamilies();
if(!runId){renderUnavailable("No run ID was supplied. Open Assembly Preview from a report or Qualified Review matter.");}
else boot().catch(e=>renderUnavailable(e?.message||String(e)));
async function boot(){const res=await fetch(endpoint);const payload=await res.json().catch(()=>({}));if(!res.ok)throw new Error(payload.message||payload.error||"Qualified Review handoff unavailable");const renderer=payload.qualified_review_renderer_payload||{};const submission=payload.qualified_review_submission||{};const gate=submission.final_gate||{};const validation=submission.validation||{};const pass=gate.status==="PASS";renderSummary([
["Target",renderer.target||payload.target||"Target under review"],["Run ID",payload.run_id||renderer.run_id||runId],["Qualified Review",gate.status||"Not submitted"],["Resolved items",gate.resolved_question_count??0],["Unresolved items",gate.unresolved_question_count??renderer.question_count??0],["Assembly backend","Not active"],["Preview status",pass?"Readiness preview available":"Blocked pending Qualified Review"],["Local counsel review","Required"]]);
els.state.textContent=pass?"Qualified Review complete · Preview only":"Blocked · Requires Qualified Review";
const checks=[
[Boolean(runId),"Shared run ID present","Assembly Preview is tied to the same matter run."],
[renderer.no_document_assembly===true||renderer.render_contract?.no_document_assembly===true,"QR boundary preserved","Qualified Review remains separate and performs no assembly."],
[pass,"Qualified Review submitted","A final PASS receipt is required before future assembly."],
[(validation.blocking_errors||[]).length===0,"No blocking QR validation errors","Blocking review errors must be resolved upstream."],
[false,"Assembly backend active","The backend is not active; generation remains disabled."],
[false,"Review-Ready draft generated","No draft exists and none is simulated on this page."]];renderChecks(checks);const blockers=[];if(!pass)blockers.push("Qualified Review final gate has not passed.");if((validation.blocking_errors||[]).length)blockers.push(...validation.blocking_errors.map(x=>`Qualified Review error: ${clean(x)}`));blockers.push("Assembly backend is not active.","No document-generation route is exposed.","Local counsel review remains mandatory for any future Review-Ready Draft.");renderBlockers(blockers);announce("Assembly Preview loaded. No document generation is active.");}
function renderFamilies(){els.families.replaceChildren(...families.map(f=>{const l=node("label","assembly-family-card");const i=document.createElement("input");i.type="radio";i.name="assembly-family";i.value=f.id;i.addEventListener("change",()=>{document.querySelectorAll(".assembly-family-card").forEach(x=>x.classList.toggle("selected",x.contains(i)&&i.checked));});l.append(i,node("div","assembly-family-title",f.title),node("div","assembly-family-copy",f.copy),node("div","assembly-family-status","Preview only · Not active"));return l;}));}
function renderSummary(rows){els.summary.replaceChildren(...rows.map(([l,v])=>{const x=node("div","assembly-summary-item");x.append(node("div","assembly-summary-label",l),node("div","assembly-summary-value",String(v)));return x;}));}
function renderChecks(rows){const w=node("div","assembly-check-list");rows.forEach(([ok,t,c])=>{const x=node("div",`assembly-check ${ok?"pass":"fail"}`);x.append(node("span","assembly-check-mark"));const b=node("div");b.append(node("div","assembly-check-title",t),node("div","assembly-check-copy",c));x.append(b);w.append(x);});els.ready.replaceChildren(w);}
function renderBlockers(rows){const w=node("div","assembly-blocker-list");rows.forEach(v=>{const x=node("div","assembly-blocker");x.append(node("span","assembly-check-mark"));const b=node("div");b.append(node("div","assembly-blocker-title",v));x.append(b);w.append(x);});els.blocked.replaceChildren(w);}
function renderUnavailable(msg){els.state.textContent="Preview unavailable";renderSummary([["Run ID",runId||"Missing"],["Assembly backend","Not active"],["Status","Preview only"]]);renderChecks([[false,"Qualified Review handoff unavailable",msg],[false,"Assembly backend active","Not active"]]);renderBlockers([msg,"Assembly backend is not active.","No document has been generated."]);announce(msg);}
function announce(v){if(els.live)els.live.textContent=v;}function clean(v){return String(v||"").replace(/_/g," ");}function byId(id){return document.getElementById(id);}function node(t,c,x){const e=document.createElement(t);if(c)e.className=c;if(x!==undefined)e.textContent=String(x);return e;}
})();