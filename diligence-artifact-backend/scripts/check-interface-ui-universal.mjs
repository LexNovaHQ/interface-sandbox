import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root=process.cwd();
const base="public/interface-diligence/diligence-system/";
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const pages={
  landing:read(base+"index.html"),report:read(base+"report.html"),annexure:read(base+"technical-annexure.html"),qr:read(base+"qualified-review.html"),assembly:read(base+"assembly-engine.html"),signals:read(base+"signals-preview.html"),sector:read(base+"operator-sector-packages.html")
};
const bridge=read(base+"report-p12-payload-adapter.js");
const runtime=read(base+"report-document-runtime.js");
const stateCss=read(base+"interface-state-system.css");
const stateJs=read(base+"interface-state-system.js");
const sectorJs=read(base+"operator-sector-packages.js");
const pkg=JSON.parse(read("package.json"));

for(const [name,page] of Object.entries(pages)){
  has(page,"interface-ui-shell.css",`${name}: shared shell missing`);
  has(page,'<meta name="robots" content="noindex,nofollow"',`${name}: noindex missing`);
  has(page,'<span class="wordmark-title">The Interface</span>',`${name}: identity changed`);
  has(page,"Law × Technology · AI Governance · Privacy · Systems",`${name}: subtitle changed`);
  lacks(page,"Lex Nova Diligence Engine",`${name}: Lex Nova rebrand leakage`);
  lacks(page,"Download JSON",`${name}: public Download JSON action forbidden`);
  lacks(page,"M7 ",`${name}: stale M-stage label`);lacks(page,"M8 ",`${name}: stale M-stage label`);lacks(page,"M9 ",`${name}: stale M-stage label`);lacks(page,"M10 ",`${name}: stale M-stage label`);lacks(page,"M11 ",`${name}: stale M-stage label`);lacks(page,"M12 ",`${name}: stale M-stage label`);
}

has(pages.landing,"<title>Interface Diligence Engine</title>");
has(pages.landing,'<div class="eyebrow">Diligence Intake</div>');
has(pages.landing,"<h1>Start a legal diligence run.</h1>");
has(pages.report,"report-p12-payload-adapter.js");
has(pages.annexure,"Public Technical Annexure");
has(pages.qr,"Qualified Review Workspace");
has(pages.assembly,"Preview · Not yet active");
has(pages.assembly,"Generate Draft — Not Active");
has(pages.signals,"Preview · Navigation only");
has(pages.signals,"Phase 12 report outputs");
has(pages.sector,"Operator Diagnostics");
has(pages.sector,"Internal · Read only");

has(bridge,'renderer_payload.v14.co_p12_05');
has(bridge,'report_manifest_clean_profiles');
has(bridge,'normalized_section_artifacts_only');
has(runtime,'SOURCE = "report_manifest_clean_profiles"');
has(runtime,'SCHEMA = "renderer_payload.v14.co_p12_05"');
has(runtime,"Renderer payload is unavailable");
has(runtime,"Report not ready");

for(const token of ["INTERFACE_STATE_SYSTEM_V1","is-report_not_ready","is-controlled_failure","is-pass_with_limitation","is-missing_artifact","is-network_failure","@media(max-width:640px)"])has(stateCss,token);
for(const token of ["interface_state_system.v1","report_not_ready","controlled_failure","pass_with_limitation","missing_artifact","network_failure","MutationObserver"])has(stateJs,token);
for(const token of ["domain_package_catalog_v0","passive_manifest","AI_Registry_Key.yml","FinTech_Registry_Key.yml","Diligence_Field_Derivation_Registry.yml","source-hint","dynamic_routing_enabled:false"])has(sectorJs,token);

for(const file of [
  base+"interface-state-system.js",base+"operator-sector-packages.js",base+"assembly-engine.js",base+"signals-preview.js",base+"technical-annexure.js",base+"qualified-review-system/qualified-review.js",base+"report-p12-payload-adapter.js",base+"report-document-runtime.js",
  "scripts/check-interface-ui-universal.mjs","scripts/check-interface-report-ui-contract.mjs","scripts/check-interface-annex-qr-contract.mjs","scripts/check-interface-assembly-signals-contract.mjs"
]){
  const result=spawnSync(process.execPath,["--check",path.join(root,file)],{encoding:"utf8"});
  assert.equal(result.status,0,`${file} syntax failed: ${result.stderr||result.stdout}`);
}
assert.equal(pkg.scripts["check:interface-ui"],"node scripts/check-interface-ui-universal.mjs && node scripts/check-interface-report-ui-contract.mjs && node scripts/check-interface-annex-qr-contract.mjs && node scripts/check-interface-assembly-signals-contract.mjs && node scripts/check-interface-report-visual-regression.mjs");
console.log(JSON.stringify({check:"interface-ui",status:"PASS",pages:Object.keys(pages),shared_shell:true,p12_adapter_current:true,stale_renderer_rejected:true,lex_nova_rebrand_leakage:false,download_json_public_action:false,sector_admin:true,controlled_states:true},null,2));

function has(source,token,message){assert.ok(source.includes(token),message||`missing ${token}`)}
function lacks(source,token,message){assert.equal(source.includes(token),false,message||`forbidden ${token}`)}
