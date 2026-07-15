(function(){
"use strict";
const VERSION="interface_sector_admin.v1";
const runId=new URLSearchParams(location.search).get("run_id")||"";
const catalog={id:"domain_package_catalog_v0",version:"0.1",runtime_mode:"passive_manifest",primary:16,capability:8,regulatory:10,review:1};
const registryKeys=[
  ["AI Registry Key","AI_Registry_Key.yml","Contract present"],
  ["FinTech Registry Key","FinTech_Registry_Key.yml","Contract present"],
  ["Field Derivation Registry","Diligence_Field_Derivation_Registry.yml","Contract present"]
];
const sourceHints=[
  ["Core source-hint loader","Non-narrowing discovery hints","Contract expected"],
  ["AI source-hint pack","AI discovery vocabulary","Contract expected"],
  ["FinTech source-hint pack","FinTech discovery vocabulary","Contract expected"],
  ["Union probe","Cross-pack discovery union","Contract expected"]
];
const checks=[
  ["Package key","check-domain-package-key.mjs","Repository check wired"],
  ["Package catalog","check-package-catalog-v0.mjs","Repository check wired"],
  ["Pre-Phase 1 preflight","check-pre-phase-1-domain-preflight.mjs","Repository check wired"],
  ["Active run manifest","check-active-run-package-manifest-v0.mjs","Repository check wired"],
  ["Selection manifest sync","check-domain-selection-manifest-sync.mjs","Repository check wired"]
];
const q=id=>document.getElementById(id),node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!=null)el.textContent=String(text);return el};
window.InterfaceSectorAdmin=Object.freeze({version:VERSION,read_only:true,dynamic_routing_enabled:false});
renderStatic();
if(runId) loadRun(runId); else renderNoRun();
function renderStatic(){
  q("packageManifestStatus").replaceChildren(list([
    ["Catalog ID",catalog.id,"pass"],["Version",catalog.version,"pass"],["Runtime mode",catalog.runtime_mode,"warn"],["Primary packages",catalog.primary,"pass"],["Capability overlays",catalog.capability,"pass"],["Regulatory overlays",catalog.regulatory,"pass"],["Review overlays",catalog.review,"pass"]
  ]));
  q("registryKeyStatus").replaceChildren(list(registryKeys.map(([a,b,c])=>[a,`${b} · ${c}`,"pass"])));
  q("sourceHintStatus").replaceChildren(list(sourceHints.map(([a,b,c])=>[a,`${b} · ${c}`,"warn"])));
  q("sectorValidationStatus").replaceChildren(list(checks.map(([a,b,c])=>[a,`${b} · ${c}`,"pass"])));
}
async function loadRun(id){
  q("activePackageStatus").textContent="Checking run";
  try{
    const response=await fetch(`/public/diligence-system/status/${encodeURIComponent(id)}`);
    const payload=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(`${response.status}: ${payload.message||payload.error||"Run status unavailable"}`);
    const manifest=payload.active_run_package_manifest||payload.package_manifest||payload.domain_selection_profile||{};
    const primary=manifest.primary_package_id||manifest.primary_domain_package||manifest.primary_package||"Not exposed";
    const capability=manifest.capability_overlays||manifest.capability_overlay_ids||[];
    const regulatory=manifest.regulatory_overlays||manifest.regulatory_overlay_ids||[];
    const state=manifest.status||payload.status||"Available";
    q("activePackageStatus").textContent=state;
    q("activePackageSummary").replaceChildren(
      tile("Run ID",id),tile("Primary Sector",primary),tile("Capability overlays",format(capability)),tile("Regulatory overlays",format(regulatory)),tile("Manifest status",state),tile("Dynamic routing","Disabled"),tile("Report authority","Phase 12"),tile("Mutation power","None")
    );
    announce("Sector package diagnostics loaded.");
  }catch(error){
    q("activePackageStatus").textContent="Live verification unavailable";
    q("activePackageSummary").replaceChildren(tile("Run ID",id),tile("Live status","Unavailable"),tile("Catalog contract","Present"),tile("Operator action","Run local package checks"));
    window.InterfaceUIState?.render?.({target:q("activePackageSummary"),kind:"network_failure",title:"Run package state unavailable",message:error.message,compact:true});
    announce("Run package diagnostics unavailable.");
  }
}
function renderNoRun(){q("activePackageSummary").replaceChildren(tile("Run ID","Not attached"),tile("Catalog contract","Present"),tile("Runtime mode","Passive manifest"),tile("Operator action","Add ?run_id=... for run-scoped verification"));}
function list(rows){const root=node("div","sector-admin-list");rows.forEach(([label,value,state])=>{const row=node("div","sector-admin-item");const body=node("div");body.append(node("div","sector-admin-label",label),node("div","sector-admin-value",value));row.append(body,node("span",`sector-admin-pill ${state||""}`,state==="pass"?"Present":state==="block"?"Blocked":"Verify"));root.append(row)});return root;}
function tile(label,value){const el=node("div","sector-admin-item");const body=node("div");body.append(node("div","sector-admin-label",label),node("div","sector-admin-value",format(value)));el.append(body);return el;}
function format(value){return Array.isArray(value)?(value.length?value.join(", "):"None"):String(value??"—");}
function announce(message){const el=q("sectorAdminLiveStatus");if(el)el.textContent=message;}
})();
