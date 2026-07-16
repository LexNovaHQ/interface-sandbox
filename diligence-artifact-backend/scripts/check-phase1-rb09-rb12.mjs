import assert from "node:assert/strict";
import { buildCanonicalSelection, assertCanonicalSelection } from "../src/phases/01-source-discovery/services/canonical-selection.service.js";
import { buildFinalDedupedManifest, assertFinalDedupedManifest } from "../src/phases/01-source-discovery/services/final-deduped-manifest.service.js";
import { applySelectedExtractionScope, assertSelectedExtractionResult, hashBlock } from "../src/phases/01-source-discovery/services/selected-extraction.service.js";
import { createBlockDedupeState, dedupeExtractedSource, serialiseBlockDedupeState, assertBlockDedupeState } from "../src/phases/01-source-discovery/services/post-extraction-block-dedupe.service.js";
import { applyUniversalExtractionControls, NO_RETAINED_MATERIAL_ACTION } from "../src/phases/01-source-discovery/services/universal-source-extraction.service.js";

const a = `Canonical translation evidence ${"language coverage pricing API ".repeat(45)}`.trim();
const b = `Canonical enterprise evidence ${"use cases transliteration support ".repeat(45)}`.trim();
const c = "This English to Hindi variant uniquely supports code-mixed input without pre-normalising the script.";
const records = [
  cand("C1", "https://sarvam.ai/apis/translation", "product_service.URL.001"),
  cand("C2", "https://sarvam.ai/apis/translation/tamil-to-marathi", "product_service.URL.002"),
  cand("C3", "https://sarvam.ai/apis/translation/english-to-hindi", "product_service.URL.003"),
  cand("C4", "https://sarvam.ai/privacy-policy", "privacy_data_processing.URL.001")
];
const fps = [fp("C1", "H1", [a,b]), fp("C2", "H1", [a,b]), fp("C3", "H3", [a,c]), fp("C4", "H4", ["Privacy Policy Effective Date personal data retention security choices contacts."])];
const cluster = [cl("C1","product_service","translation","commercial_product","translation_overview"),cl("C2","product_service","translation","commercial_product","translation_language_pair"),cl("C3","product_service","translation","commercial_product","translation_language_pair"),cl("C4","privacy_data_processing","legal_governance","legal_instrument","none")];
const legal = records.map((r)=>({candidate_id:r.candidate_id,canonical_identity:r.canonical_identity,confirmed_legal_instrument:r.candidate_id==="C4",classification_status:r.candidate_id==="C4"?"CONFIRMED_LEGAL_INSTRUMENT":"NOT_LEGAL_INSTRUMENT",doc_type:r.candidate_id==="C4"?"privacy_policy":"other",artifact_name_hint:r.candidate_id==="C4"?"legal_doc_privacy_policy":"legal_doc_other"}));
const selection = buildCanonicalSelection({canonicalInventory:{canonical_candidates:records},fingerprintInventory:{fingerprints:fps},rootFeatureLaneClustering:{source_classifications:cluster},legalClassification:{classifications:legal}});
assertCanonicalSelection(selection);
assert.equal(d("C1").source_disposition,"SELECTED_CANONICAL");
assert.equal(d("C2").source_disposition,"ALIAS_EXACT_DUPLICATE");
assert.equal(d("C3").extraction_scope,"SELECTED_UNIQUE_SECTIONS");
assert.deepEqual(d("C3").selected_block_hashes,[hashBlock(c)]);
assert.equal(d("C4").extraction_scope,"FULL_DOCUMENT");

const legacy = {target_url:"https://sarvam.ai/",manifest_sources:[mr("product_service.URL.001",records[0].canonical_url,"product_service"),mr("product_service.URL.002",records[1].canonical_url,"product_service"),mr("product_service.URL.003",records[2].canonical_url,"product_service"),mr("privacy_data_processing.URL.001",records[3].canonical_url,"privacy_data_processing",true)]};
const finalManifest = buildFinalDedupedManifest({legacyManifest:legacy,canonicalSelection:selection});
assertFinalDedupedManifest(finalManifest,selection);
assert.equal(finalManifest.manifest_sources.filter((r)=>r.extraction_decision==="EXTRACT").length,3);
const uniqueRow = finalManifest.manifest_sources.find((r)=>r.canonical_candidate_id==="C3");
const scoped = applySelectedExtractionScope({manifestRow:uniqueRow,extracted:{ok:true,lossless_text:`${a}\n\n${c}`,extraction_warnings:[]}});
assertSelectedExtractionResult(uniqueRow,scoped);
assert.equal(scoped.lossless_text,c);
assert.equal(scoped.extraction_scope_forensics.omitted_block_count,1);

const scopeMismatch = scopeMismatchFixture();
applyUniversalExtractionControls(scopeMismatch);
assert.equal(scopeMismatch.output.source_family_index.root_artifact_manifest.company_identity.source_count, 0);
assert.deepEqual(scopeMismatch.output.source_family_index.root_artifact_manifest.company_identity.required_artifacts, []);
assert.equal(scopeMismatch.output.lossless_root__company_identity, undefined);
const scopeSuppression = scopeMismatch.output.source_family_index.manifest_only_index.find((row)=>row.source_id==="company_identity.SRC.007");
assert.equal(scopeSuppression.extraction_status, NO_RETAINED_MATERIAL_ACTION);
assert.equal(scopeSuppression.extraction_decision, "MANIFEST_ONLY");
assert.equal(scopeMismatch.output.source_family_index.post_scope_suppression_forensics.suppressed_count, 1);

const state = createBlockDedupeState();
assert.equal(dedupeExtractedSource({root:"product_service",source:src("S1",a),state}).action,"RETAIN");
const duplicate = dedupeExtractedSource({root:"product_service",source:src("S2",a),state});
assert.equal(duplicate.action,"SUPPRESS_EXACT_DUPLICATE");
assert.equal(duplicate.duplicate_owner_source_id,"S1");
const serialised = serialiseBlockDedupeState(state); assertBlockDedupeState(serialised);
console.log(JSON.stringify({check:"phase1 RB09 RB12",status:"PASS",decisions:selection.decisions.length,extract_rows:3,exact_duplicates_suppressed:1,empty_post_scope_sources_assembled:0,material_fingerprint_required:true},null,2));

function scopeMismatchFixture(){
  const manifestId="company_identity.URL.099";
  return {
    deduped_url_manifest:{manifest_sources:[{
      manifest_id:manifestId,
      entity_id:"entity",
      entity_status:"PRIMARY_TARGET",
      canonical_candidate_id:"CANON.COMPANY.099",
      canonical_identity:"entity|https://example.test/about",
      common_root:"company_identity",
      canonical_url:"https://example.test/about",
      fetch_url:"https://example.test/about",
      route_type:"company_identity",
      materiality:"company_identity",
      admission_tier:"PRIMARY",
      extraction_decision:"EXTRACT",
      extraction_scope:"SELECTED_UNIQUE_SECTIONS",
      selected_block_hashes:["hash-not-present-in-final-extraction"],
      source_disposition:"SELECTED_PARTIAL_CONTRIBUTOR",
      canonical_owner_candidate_id:"CANON.COMPANY.001",
      feature_cluster:"company_identity",
      evidence_lane:"corporate_strategy",
      variant_family:"none",
      secondary_root_references:[],
      legal_doc_candidate:false
    }]},
    output:{
      source_family_index:{
        discovered_source_index:[{source_id:"company_identity.SRC.007",manifest_id:manifestId,common_root:"company_identity",legal_doc_candidate:false}],
        manifest_only_index:[],
        root_artifact_manifest:{company_identity:{common_root:"company_identity",required_artifacts:["lossless_root__company_identity"],source_count:1,source_ids:["company_identity.SRC.007"],manifest_rows_seen:1}},
        corpus_forensics:{}
      },
      lossless_root__company_identity:{artifact_name:"lossless_root__company_identity",common_root:"company_identity",sources:[{source_id:"company_identity.SRC.007",manifest_id:manifestId,common_root:"company_identity",canonical_url:"https://example.test/about",lossless_text:"This is a substantive company identity page with business history, corporate positioning, operating context, leadership information, and other actual evidence that was material during fingerprinting but whose declared unique block no longer matches the final extraction body.",extraction_warnings:[]}],manifest_only_sources:[],metadata_only_sources:[],legal_document_sources:[],rejected_sources:[],missing_limited_primary_sources:[],corpus_forensics:{},dedupe_forensics:{}},
      legal_doc_inventory:{documents_found:[]}
    }
  };
}
function d(id){return selection.decisions.find((x)=>x.candidate_id===id);}
function cand(id,url,legacyId){return {candidate_id:id,canonical_identity:`sarvam|${url}`,entity_id:"sarvam",entity_status:"PRIMARY_TARGET",canonical_url:url,fetch_url:url,aliases:[],legacy_manifest_ids:[legacyId],extraction_authorized_by_legacy_manifest:true};}
function fp(id,hash,blocks){const text=blocks.join(" ");return {candidate_id:id,fingerprint_id:`FP.${id}`,fetch_status:"FETCHED",extraction_eligible:true,content_materiality:{schema_version:"PHASE1_SOURCE_CONTENT_MATERIALITY_RB18_v1",status:"MATERIAL_CONTENT",extraction_eligible:true,character_count:text.length,token_count:text.split(/\s+/).length,unique_token_count:new Set(text.toLowerCase().split(/\s+/)).size,meaningful_block_count:blocks.length,thresholds:{minimum_characters:60,minimum_tokens:8,minimum_unique_tokens:5,minimum_blocks:1},placeholder_signals:[],reasons:[]},exact_content_hash:hash,block_hashes:blocks.map((x,i)=>({block_index:i+1,sha256:hashBlock(x),character_count:x.length})),near_duplicate_signature:{sampled_hashes:blocks.map((x)=>hashBlock(x).slice(0,16))},template_signature:"sarvam.ai/template",title:id==="C4"?"Privacy Policy":"Translation",fingerprint_bytes_used:text.length,warnings:[]};}
function cl(id,root,feature,lane,variant){const r=records.find((x)=>x.candidate_id===id);return {candidate_id:id,canonical_identity:r.canonical_identity,entity_id:r.entity_id,primary_root:root,secondary_root_references:[],feature_cluster:feature,evidence_lane:lane,variant_family:variant,ai_overlay:null};}
function mr(id,url,root,legal=false){return {manifest_id:id,common_root:root,root_traversal_policy:"PRIMARY_FULL_EXTRACT",canonical_url:url,canonical_url_key:url,fetch_url:url,route_type:legal?"privacy_policy":"translation",route_type_aliases:[],materiality:legal?"legal_document":"product_activity",source_signal_roles:legal?["LEGAL_DOCUMENT_SIGNAL"]:["PRODUCT_ACTIVITY_SIGNAL"],technical_route_shape:null,api_data_flow_signal:{present:false,basis:[]},neutral_buckets:legal?["legal_terms_sources"]:["product_activity_sources"],discovered_by:["FIXTURE"],admission_tier:"PRIMARY",extraction_decision:"EXTRACT",legal_doc_candidate:legal,legal_doc_type:legal?"privacy_policy":"other",phase_1_classification_effect:"SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING"};}
function src(id,text){return {source_id:id,canonical_url:`https://example.test/${id}`,lossless_text:text,sha256:hashBlock(text)};}
