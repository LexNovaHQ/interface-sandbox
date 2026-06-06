"use strict";
export const validate_sourceBundle = validate20;
const schema31 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://interface-sandbox.local/schemas/sourceBundle.schema.json","title":"Source Bundle","description":"Canonical source_bundle. Discovery output is not evidence until Source Collector admission. Full raw scrape text is active-run material; final report payload stores excerpts, hashes, provenance, limitations, and admission status. Multiple manual URLs are represented in target_input.manual_urls while source_mode remains url unless pasted text is also supplied.","type":"object","required":["run_id","source_mode","target_input","source_review","discovery_candidates","artifact_inventory","evidence_buffer","limitations"],"additionalProperties":false,"properties":{"run_id":{"type":"string"},"source_mode":{"type":"string","enum":["url","text","url_plus_text"]},"target_input":{"type":"object","required":["submitted_at"],"additionalProperties":false,"properties":{"primary_url":{"type":"string"},"manual_urls":{"type":"array","items":{"type":"string"}},"pasted_text_present":{"type":"boolean"},"submitted_at":{"type":"string","format":"date-time"}}},"source_review":{"type":"object","required":["summary","pages_attempted","pages_admitted","limitations"],"additionalProperties":false,"properties":{"summary":{"type":"string"},"pages_attempted":{"type":"integer","minimum":0},"pages_admitted":{"type":"integer","minimum":0},"limitations":{"type":"array","items":{"type":"string"}}}},"discovery_candidates":{"type":"array","items":{"type":"object","required":["candidate_id","source_url","status"],"additionalProperties":false,"properties":{"candidate_id":{"type":"string"},"source_url":{"type":"string"},"discovered_by":{"type":"string"},"status":{"const":"DISCOVERY_ONLY"},"notes":{"type":"string"}}}},"artifact_inventory":{"type":"array","items":{"$ref":"#/$defs/artifact"}},"evidence_buffer":{"type":"array","items":{"$ref":"#/$defs/evidence"}},"limitations":{"type":"array","items":{"type":"string"}}},"$defs":{"artifactClass":{"type":"string","enum":["homepage","product","pricing","terms","privacy","dpa","aup","sla","security","subprocessors","docs","api","trust","other"]},"zone":{"type":"string","enum":["mechanical","commercial","governance","context","manual_text"]},"admissionStatus":{"type":"string","enum":["ADMITTED","DISCOVERY_ONLY","REJECTED"]},"artifact":{"type":"object","required":["artifact_id","source_url","zone","artifact_class","status","admission_status","is_first_party","source_hash","extracted_excerpt","limitations"],"additionalProperties":false,"properties":{"artifact_id":{"type":"string"},"source_url":{"type":"string"},"zone":{"$ref":"#/$defs/zone"},"artifact_class":{"$ref":"#/$defs/artifactClass"},"status":{"type":"string","enum":["INGESTED","ABSENT","ACCESS_FAILED","EXCLUDED","DUPLICATE","TEXT_ONLY"]},"admission_status":{"$ref":"#/$defs/admissionStatus"},"is_first_party":{"type":"boolean"},"source_hash":{"type":"string"},"extracted_excerpt":{"type":"string"},"limitations":{"type":"array","items":{"type":"string"}}}},"evidence":{"type":"object","required":["evidence_id","artifact_id","source_url","source_type","ingestion_method","artifact_class","zone","evidence_text","extracted_excerpt","source_hash","evidence_scope","first_party_basis","limitations"],"additionalProperties":false,"properties":{"evidence_id":{"type":"string"},"artifact_id":{"type":"string"},"source_url":{"type":"string"},"source_type":{"type":"string","enum":["webpage","manual_text","document"]},"ingestion_method":{"type":"string","enum":["jina","manual","direct_url","pasted_text"]},"artifact_class":{"$ref":"#/$defs/artifactClass"},"zone":{"$ref":"#/$defs/zone"},"evidence_text":{"type":"string"},"extracted_excerpt":{"type":"string"},"source_hash":{"type":"string"},"evidence_scope":{"type":"string"},"first_party_basis":{"type":"string"},"limitations":{"type":"array","items":{"type":"string"}}}}}};
const schema32 = {"type":"object","required":["artifact_id","source_url","zone","artifact_class","status","admission_status","is_first_party","source_hash","extracted_excerpt","limitations"],"additionalProperties":false,"properties":{"artifact_id":{"type":"string"},"source_url":{"type":"string"},"zone":{"$ref":"#/$defs/zone"},"artifact_class":{"$ref":"#/$defs/artifactClass"},"status":{"type":"string","enum":["INGESTED","ABSENT","ACCESS_FAILED","EXCLUDED","DUPLICATE","TEXT_ONLY"]},"admission_status":{"$ref":"#/$defs/admissionStatus"},"is_first_party":{"type":"boolean"},"source_hash":{"type":"string"},"extracted_excerpt":{"type":"string"},"limitations":{"type":"array","items":{"type":"string"}}}};
const schema33 = {"type":"string","enum":["mechanical","commercial","governance","context","manual_text"]};
const schema34 = {"type":"string","enum":["homepage","product","pricing","terms","privacy","dpa","aup","sla","security","subprocessors","docs","api","trust","other"]};
const schema35 = {"type":"string","enum":["ADMITTED","DISCOVERY_ONLY","REJECTED"]};
const func1 = Object.prototype.hasOwnProperty;

function validate21(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate21.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.artifact_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "artifact_id"},message:"must have required property '"+"artifact_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.source_url === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_url"},message:"must have required property '"+"source_url"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.zone === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "zone"},message:"must have required property '"+"zone"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.artifact_class === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "artifact_class"},message:"must have required property '"+"artifact_class"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.status === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.admission_status === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "admission_status"},message:"must have required property '"+"admission_status"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.is_first_party === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "is_first_party"},message:"must have required property '"+"is_first_party"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.source_hash === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_hash"},message:"must have required property '"+"source_hash"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.extracted_excerpt === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "extracted_excerpt"},message:"must have required property '"+"extracted_excerpt"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.limitations === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "limitations"},message:"must have required property '"+"limitations"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema32.properties, key0))){
const err10 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.artifact_id !== undefined){
if(typeof data.artifact_id !== "string"){
const err11 = {instancePath:instancePath+"/artifact_id",schemaPath:"#/properties/artifact_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.source_url !== undefined){
if(typeof data.source_url !== "string"){
const err12 = {instancePath:instancePath+"/source_url",schemaPath:"#/properties/source_url/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.zone !== undefined){
let data2 = data.zone;
if(typeof data2 !== "string"){
const err13 = {instancePath:instancePath+"/zone",schemaPath:"#/$defs/zone/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!(((((data2 === "mechanical") || (data2 === "commercial")) || (data2 === "governance")) || (data2 === "context")) || (data2 === "manual_text"))){
const err14 = {instancePath:instancePath+"/zone",schemaPath:"#/$defs/zone/enum",keyword:"enum",params:{allowedValues: schema33.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.artifact_class !== undefined){
let data3 = data.artifact_class;
if(typeof data3 !== "string"){
const err15 = {instancePath:instancePath+"/artifact_class",schemaPath:"#/$defs/artifactClass/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(!((((((((((((((data3 === "homepage") || (data3 === "product")) || (data3 === "pricing")) || (data3 === "terms")) || (data3 === "privacy")) || (data3 === "dpa")) || (data3 === "aup")) || (data3 === "sla")) || (data3 === "security")) || (data3 === "subprocessors")) || (data3 === "docs")) || (data3 === "api")) || (data3 === "trust")) || (data3 === "other"))){
const err16 = {instancePath:instancePath+"/artifact_class",schemaPath:"#/$defs/artifactClass/enum",keyword:"enum",params:{allowedValues: schema34.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.status !== undefined){
let data4 = data.status;
if(typeof data4 !== "string"){
const err17 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(!((((((data4 === "INGESTED") || (data4 === "ABSENT")) || (data4 === "ACCESS_FAILED")) || (data4 === "EXCLUDED")) || (data4 === "DUPLICATE")) || (data4 === "TEXT_ONLY"))){
const err18 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/enum",keyword:"enum",params:{allowedValues: schema32.properties.status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.admission_status !== undefined){
let data5 = data.admission_status;
if(typeof data5 !== "string"){
const err19 = {instancePath:instancePath+"/admission_status",schemaPath:"#/$defs/admissionStatus/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(!(((data5 === "ADMITTED") || (data5 === "DISCOVERY_ONLY")) || (data5 === "REJECTED"))){
const err20 = {instancePath:instancePath+"/admission_status",schemaPath:"#/$defs/admissionStatus/enum",keyword:"enum",params:{allowedValues: schema35.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.is_first_party !== undefined){
if(typeof data.is_first_party !== "boolean"){
const err21 = {instancePath:instancePath+"/is_first_party",schemaPath:"#/properties/is_first_party/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.source_hash !== undefined){
if(typeof data.source_hash !== "string"){
const err22 = {instancePath:instancePath+"/source_hash",schemaPath:"#/properties/source_hash/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.extracted_excerpt !== undefined){
if(typeof data.extracted_excerpt !== "string"){
const err23 = {instancePath:instancePath+"/extracted_excerpt",schemaPath:"#/properties/extracted_excerpt/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.limitations !== undefined){
let data9 = data.limitations;
if(Array.isArray(data9)){
const len0 = data9.length;
for(let i0=0; i0<len0; i0++){
if(typeof data9[i0] !== "string"){
const err24 = {instancePath:instancePath+"/limitations/" + i0,schemaPath:"#/properties/limitations/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
}
else {
const err25 = {instancePath:instancePath+"/limitations",schemaPath:"#/properties/limitations/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
}
else {
const err26 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
validate21.errors = vErrors;
return errors === 0;
}
validate21.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema36 = {"type":"object","required":["evidence_id","artifact_id","source_url","source_type","ingestion_method","artifact_class","zone","evidence_text","extracted_excerpt","source_hash","evidence_scope","first_party_basis","limitations"],"additionalProperties":false,"properties":{"evidence_id":{"type":"string"},"artifact_id":{"type":"string"},"source_url":{"type":"string"},"source_type":{"type":"string","enum":["webpage","manual_text","document"]},"ingestion_method":{"type":"string","enum":["jina","manual","direct_url","pasted_text"]},"artifact_class":{"$ref":"#/$defs/artifactClass"},"zone":{"$ref":"#/$defs/zone"},"evidence_text":{"type":"string"},"extracted_excerpt":{"type":"string"},"source_hash":{"type":"string"},"evidence_scope":{"type":"string"},"first_party_basis":{"type":"string"},"limitations":{"type":"array","items":{"type":"string"}}}};

function validate23(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate23.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.evidence_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence_id"},message:"must have required property '"+"evidence_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.artifact_id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "artifact_id"},message:"must have required property '"+"artifact_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.source_url === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_url"},message:"must have required property '"+"source_url"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.source_type === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_type"},message:"must have required property '"+"source_type"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.ingestion_method === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "ingestion_method"},message:"must have required property '"+"ingestion_method"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.artifact_class === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "artifact_class"},message:"must have required property '"+"artifact_class"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.zone === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "zone"},message:"must have required property '"+"zone"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.evidence_text === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence_text"},message:"must have required property '"+"evidence_text"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.extracted_excerpt === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "extracted_excerpt"},message:"must have required property '"+"extracted_excerpt"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.source_hash === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_hash"},message:"must have required property '"+"source_hash"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.evidence_scope === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence_scope"},message:"must have required property '"+"evidence_scope"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.first_party_basis === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "first_party_basis"},message:"must have required property '"+"first_party_basis"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.limitations === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "limitations"},message:"must have required property '"+"limitations"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema36.properties, key0))){
const err13 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.evidence_id !== undefined){
if(typeof data.evidence_id !== "string"){
const err14 = {instancePath:instancePath+"/evidence_id",schemaPath:"#/properties/evidence_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.artifact_id !== undefined){
if(typeof data.artifact_id !== "string"){
const err15 = {instancePath:instancePath+"/artifact_id",schemaPath:"#/properties/artifact_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.source_url !== undefined){
if(typeof data.source_url !== "string"){
const err16 = {instancePath:instancePath+"/source_url",schemaPath:"#/properties/source_url/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.source_type !== undefined){
let data3 = data.source_type;
if(typeof data3 !== "string"){
const err17 = {instancePath:instancePath+"/source_type",schemaPath:"#/properties/source_type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(!(((data3 === "webpage") || (data3 === "manual_text")) || (data3 === "document"))){
const err18 = {instancePath:instancePath+"/source_type",schemaPath:"#/properties/source_type/enum",keyword:"enum",params:{allowedValues: schema36.properties.source_type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.ingestion_method !== undefined){
let data4 = data.ingestion_method;
if(typeof data4 !== "string"){
const err19 = {instancePath:instancePath+"/ingestion_method",schemaPath:"#/properties/ingestion_method/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(!((((data4 === "jina") || (data4 === "manual")) || (data4 === "direct_url")) || (data4 === "pasted_text"))){
const err20 = {instancePath:instancePath+"/ingestion_method",schemaPath:"#/properties/ingestion_method/enum",keyword:"enum",params:{allowedValues: schema36.properties.ingestion_method.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.artifact_class !== undefined){
let data5 = data.artifact_class;
if(typeof data5 !== "string"){
const err21 = {instancePath:instancePath+"/artifact_class",schemaPath:"#/$defs/artifactClass/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(!((((((((((((((data5 === "homepage") || (data5 === "product")) || (data5 === "pricing")) || (data5 === "terms")) || (data5 === "privacy")) || (data5 === "dpa")) || (data5 === "aup")) || (data5 === "sla")) || (data5 === "security")) || (data5 === "subprocessors")) || (data5 === "docs")) || (data5 === "api")) || (data5 === "trust")) || (data5 === "other"))){
const err22 = {instancePath:instancePath+"/artifact_class",schemaPath:"#/$defs/artifactClass/enum",keyword:"enum",params:{allowedValues: schema34.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.zone !== undefined){
let data6 = data.zone;
if(typeof data6 !== "string"){
const err23 = {instancePath:instancePath+"/zone",schemaPath:"#/$defs/zone/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(!(((((data6 === "mechanical") || (data6 === "commercial")) || (data6 === "governance")) || (data6 === "context")) || (data6 === "manual_text"))){
const err24 = {instancePath:instancePath+"/zone",schemaPath:"#/$defs/zone/enum",keyword:"enum",params:{allowedValues: schema33.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.evidence_text !== undefined){
if(typeof data.evidence_text !== "string"){
const err25 = {instancePath:instancePath+"/evidence_text",schemaPath:"#/properties/evidence_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.extracted_excerpt !== undefined){
if(typeof data.extracted_excerpt !== "string"){
const err26 = {instancePath:instancePath+"/extracted_excerpt",schemaPath:"#/properties/extracted_excerpt/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data.source_hash !== undefined){
if(typeof data.source_hash !== "string"){
const err27 = {instancePath:instancePath+"/source_hash",schemaPath:"#/properties/source_hash/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.evidence_scope !== undefined){
if(typeof data.evidence_scope !== "string"){
const err28 = {instancePath:instancePath+"/evidence_scope",schemaPath:"#/properties/evidence_scope/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data.first_party_basis !== undefined){
if(typeof data.first_party_basis !== "string"){
const err29 = {instancePath:instancePath+"/first_party_basis",schemaPath:"#/properties/first_party_basis/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data.limitations !== undefined){
let data12 = data.limitations;
if(Array.isArray(data12)){
const len0 = data12.length;
for(let i0=0; i0<len0; i0++){
if(typeof data12[i0] !== "string"){
const err30 = {instancePath:instancePath+"/limitations/" + i0,schemaPath:"#/properties/limitations/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
}
else {
const err31 = {instancePath:instancePath+"/limitations",schemaPath:"#/properties/limitations/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
}
else {
const err32 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
validate23.errors = vErrors;
return errors === 0;
}
validate23.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate20(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://interface-sandbox.local/schemas/sourceBundle.schema.json" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate20.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.run_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "run_id"},message:"must have required property '"+"run_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.source_mode === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_mode"},message:"must have required property '"+"source_mode"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.target_input === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "target_input"},message:"must have required property '"+"target_input"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.source_review === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_review"},message:"must have required property '"+"source_review"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.discovery_candidates === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "discovery_candidates"},message:"must have required property '"+"discovery_candidates"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.artifact_inventory === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "artifact_inventory"},message:"must have required property '"+"artifact_inventory"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.evidence_buffer === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence_buffer"},message:"must have required property '"+"evidence_buffer"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.limitations === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "limitations"},message:"must have required property '"+"limitations"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
for(const key0 in data){
if(!((((((((key0 === "run_id") || (key0 === "source_mode")) || (key0 === "target_input")) || (key0 === "source_review")) || (key0 === "discovery_candidates")) || (key0 === "artifact_inventory")) || (key0 === "evidence_buffer")) || (key0 === "limitations"))){
const err8 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.run_id !== undefined){
if(typeof data.run_id !== "string"){
const err9 = {instancePath:instancePath+"/run_id",schemaPath:"#/properties/run_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.source_mode !== undefined){
let data1 = data.source_mode;
if(typeof data1 !== "string"){
const err10 = {instancePath:instancePath+"/source_mode",schemaPath:"#/properties/source_mode/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(!(((data1 === "url") || (data1 === "text")) || (data1 === "url_plus_text"))){
const err11 = {instancePath:instancePath+"/source_mode",schemaPath:"#/properties/source_mode/enum",keyword:"enum",params:{allowedValues: schema31.properties.source_mode.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.target_input !== undefined){
let data2 = data.target_input;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.submitted_at === undefined){
const err12 = {instancePath:instancePath+"/target_input",schemaPath:"#/properties/target_input/required",keyword:"required",params:{missingProperty: "submitted_at"},message:"must have required property '"+"submitted_at"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
for(const key1 in data2){
if(!((((key1 === "primary_url") || (key1 === "manual_urls")) || (key1 === "pasted_text_present")) || (key1 === "submitted_at"))){
const err13 = {instancePath:instancePath+"/target_input",schemaPath:"#/properties/target_input/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data2.primary_url !== undefined){
if(typeof data2.primary_url !== "string"){
const err14 = {instancePath:instancePath+"/target_input/primary_url",schemaPath:"#/properties/target_input/properties/primary_url/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data2.manual_urls !== undefined){
let data4 = data2.manual_urls;
if(Array.isArray(data4)){
const len0 = data4.length;
for(let i0=0; i0<len0; i0++){
if(typeof data4[i0] !== "string"){
const err15 = {instancePath:instancePath+"/target_input/manual_urls/" + i0,schemaPath:"#/properties/target_input/properties/manual_urls/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
}
else {
const err16 = {instancePath:instancePath+"/target_input/manual_urls",schemaPath:"#/properties/target_input/properties/manual_urls/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data2.pasted_text_present !== undefined){
if(typeof data2.pasted_text_present !== "boolean"){
const err17 = {instancePath:instancePath+"/target_input/pasted_text_present",schemaPath:"#/properties/target_input/properties/pasted_text_present/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data2.submitted_at !== undefined){
if(!(typeof data2.submitted_at === "string")){
const err18 = {instancePath:instancePath+"/target_input/submitted_at",schemaPath:"#/properties/target_input/properties/submitted_at/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
}
else {
const err19 = {instancePath:instancePath+"/target_input",schemaPath:"#/properties/target_input/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.source_review !== undefined){
let data8 = data.source_review;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.summary === undefined){
const err20 = {instancePath:instancePath+"/source_review",schemaPath:"#/properties/source_review/required",keyword:"required",params:{missingProperty: "summary"},message:"must have required property '"+"summary"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data8.pages_attempted === undefined){
const err21 = {instancePath:instancePath+"/source_review",schemaPath:"#/properties/source_review/required",keyword:"required",params:{missingProperty: "pages_attempted"},message:"must have required property '"+"pages_attempted"+"'"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data8.pages_admitted === undefined){
const err22 = {instancePath:instancePath+"/source_review",schemaPath:"#/properties/source_review/required",keyword:"required",params:{missingProperty: "pages_admitted"},message:"must have required property '"+"pages_admitted"+"'"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(data8.limitations === undefined){
const err23 = {instancePath:instancePath+"/source_review",schemaPath:"#/properties/source_review/required",keyword:"required",params:{missingProperty: "limitations"},message:"must have required property '"+"limitations"+"'"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
for(const key2 in data8){
if(!((((key2 === "summary") || (key2 === "pages_attempted")) || (key2 === "pages_admitted")) || (key2 === "limitations"))){
const err24 = {instancePath:instancePath+"/source_review",schemaPath:"#/properties/source_review/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data8.summary !== undefined){
if(typeof data8.summary !== "string"){
const err25 = {instancePath:instancePath+"/source_review/summary",schemaPath:"#/properties/source_review/properties/summary/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data8.pages_attempted !== undefined){
let data10 = data8.pages_attempted;
if(!((typeof data10 == "number") && (!(data10 % 1) && !isNaN(data10)))){
const err26 = {instancePath:instancePath+"/source_review/pages_attempted",schemaPath:"#/properties/source_review/properties/pages_attempted/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(typeof data10 == "number"){
if(data10 < 0 || isNaN(data10)){
const err27 = {instancePath:instancePath+"/source_review/pages_attempted",schemaPath:"#/properties/source_review/properties/pages_attempted/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
}
if(data8.pages_admitted !== undefined){
let data11 = data8.pages_admitted;
if(!((typeof data11 == "number") && (!(data11 % 1) && !isNaN(data11)))){
const err28 = {instancePath:instancePath+"/source_review/pages_admitted",schemaPath:"#/properties/source_review/properties/pages_admitted/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(typeof data11 == "number"){
if(data11 < 0 || isNaN(data11)){
const err29 = {instancePath:instancePath+"/source_review/pages_admitted",schemaPath:"#/properties/source_review/properties/pages_admitted/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
}
if(data8.limitations !== undefined){
let data12 = data8.limitations;
if(Array.isArray(data12)){
const len1 = data12.length;
for(let i1=0; i1<len1; i1++){
if(typeof data12[i1] !== "string"){
const err30 = {instancePath:instancePath+"/source_review/limitations/" + i1,schemaPath:"#/properties/source_review/properties/limitations/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
}
else {
const err31 = {instancePath:instancePath+"/source_review/limitations",schemaPath:"#/properties/source_review/properties/limitations/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
}
else {
const err32 = {instancePath:instancePath+"/source_review",schemaPath:"#/properties/source_review/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data.discovery_candidates !== undefined){
let data14 = data.discovery_candidates;
if(Array.isArray(data14)){
const len2 = data14.length;
for(let i2=0; i2<len2; i2++){
let data15 = data14[i2];
if(data15 && typeof data15 == "object" && !Array.isArray(data15)){
if(data15.candidate_id === undefined){
const err33 = {instancePath:instancePath+"/discovery_candidates/" + i2,schemaPath:"#/properties/discovery_candidates/items/required",keyword:"required",params:{missingProperty: "candidate_id"},message:"must have required property '"+"candidate_id"+"'"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(data15.source_url === undefined){
const err34 = {instancePath:instancePath+"/discovery_candidates/" + i2,schemaPath:"#/properties/discovery_candidates/items/required",keyword:"required",params:{missingProperty: "source_url"},message:"must have required property '"+"source_url"+"'"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(data15.status === undefined){
const err35 = {instancePath:instancePath+"/discovery_candidates/" + i2,schemaPath:"#/properties/discovery_candidates/items/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
for(const key3 in data15){
if(!(((((key3 === "candidate_id") || (key3 === "source_url")) || (key3 === "discovered_by")) || (key3 === "status")) || (key3 === "notes"))){
const err36 = {instancePath:instancePath+"/discovery_candidates/" + i2,schemaPath:"#/properties/discovery_candidates/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data15.candidate_id !== undefined){
if(typeof data15.candidate_id !== "string"){
const err37 = {instancePath:instancePath+"/discovery_candidates/" + i2+"/candidate_id",schemaPath:"#/properties/discovery_candidates/items/properties/candidate_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data15.source_url !== undefined){
if(typeof data15.source_url !== "string"){
const err38 = {instancePath:instancePath+"/discovery_candidates/" + i2+"/source_url",schemaPath:"#/properties/discovery_candidates/items/properties/source_url/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(data15.discovered_by !== undefined){
if(typeof data15.discovered_by !== "string"){
const err39 = {instancePath:instancePath+"/discovery_candidates/" + i2+"/discovered_by",schemaPath:"#/properties/discovery_candidates/items/properties/discovered_by/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(data15.status !== undefined){
if("DISCOVERY_ONLY" !== data15.status){
const err40 = {instancePath:instancePath+"/discovery_candidates/" + i2+"/status",schemaPath:"#/properties/discovery_candidates/items/properties/status/const",keyword:"const",params:{allowedValue: "DISCOVERY_ONLY"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(data15.notes !== undefined){
if(typeof data15.notes !== "string"){
const err41 = {instancePath:instancePath+"/discovery_candidates/" + i2+"/notes",schemaPath:"#/properties/discovery_candidates/items/properties/notes/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
}
else {
const err42 = {instancePath:instancePath+"/discovery_candidates/" + i2,schemaPath:"#/properties/discovery_candidates/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
}
else {
const err43 = {instancePath:instancePath+"/discovery_candidates",schemaPath:"#/properties/discovery_candidates/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
if(data.artifact_inventory !== undefined){
let data21 = data.artifact_inventory;
if(Array.isArray(data21)){
const len3 = data21.length;
for(let i3=0; i3<len3; i3++){
if(!(validate21(data21[i3], {instancePath:instancePath+"/artifact_inventory/" + i3,parentData:data21,parentDataProperty:i3,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate21.errors : vErrors.concat(validate21.errors);
errors = vErrors.length;
}
}
}
else {
const err44 = {instancePath:instancePath+"/artifact_inventory",schemaPath:"#/properties/artifact_inventory/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
if(data.evidence_buffer !== undefined){
let data23 = data.evidence_buffer;
if(Array.isArray(data23)){
const len4 = data23.length;
for(let i4=0; i4<len4; i4++){
if(!(validate23(data23[i4], {instancePath:instancePath+"/evidence_buffer/" + i4,parentData:data23,parentDataProperty:i4,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
errors = vErrors.length;
}
}
}
else {
const err45 = {instancePath:instancePath+"/evidence_buffer",schemaPath:"#/properties/evidence_buffer/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(data.limitations !== undefined){
let data25 = data.limitations;
if(Array.isArray(data25)){
const len5 = data25.length;
for(let i5=0; i5<len5; i5++){
if(typeof data25[i5] !== "string"){
const err46 = {instancePath:instancePath+"/limitations/" + i5,schemaPath:"#/properties/limitations/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
}
else {
const err47 = {instancePath:instancePath+"/limitations",schemaPath:"#/properties/limitations/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
}
else {
const err48 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
validate20.errors = vErrors;
return errors === 0;
}
validate20.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

export const validate_targetFeatureProfile = validate25;
const schema39 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://interface-sandbox.local/schemas/targetFeatureProfile.schema.json","title":"Target Feature Profile","description":"Canonical target_feature_profile produced by Stage 1 from admitted evidence.","type":"object","required":["target_profile","primary_product","product_feature_map","raw_feature_candidates","feature_map_scratchpad","limitations"],"additionalProperties":false,"properties":{"target_profile":{"type":"object","required":["company_name","website","legal_entity","hq_jurisdiction","actual_processing_location","data_sovereignty_signature","primary_claim"],"additionalProperties":false,"properties":{"company_name":{"type":"string"},"website":{"type":"string"},"legal_entity":{"type":"string"},"hq_jurisdiction":{"type":"string"},"actual_processing_location":{"type":"string"},"data_sovereignty_signature":{"type":"string"},"primary_claim":{"type":"string"}}},"primary_product":{"type":"object","required":["product_name","user","function","mechanism","agent_actor","agent_brand_name"],"additionalProperties":false,"properties":{"product_name":{"type":"string"},"user":{"type":"string"},"function":{"type":"string"},"mechanism":{"type":"string"},"agent_actor":{"type":"string"},"agent_brand_name":{"type":"string"}}},"product_feature_map":{"type":"array","items":{"$ref":"#/$defs/feature"}},"raw_feature_candidates":{"type":"array","items":{"type":"object","additionalProperties":true}},"feature_map_scratchpad":{"type":"array","items":{"type":"object","additionalProperties":true}},"limitations":{"type":"array","items":{"type":"string"}}},"$defs":{"feature":{"type":"object","required":["feature_id","feature_name","feature_role","feature_description","archetype_codes","archetype_labels","surface_tokens","evidence_quote","feature_source_url","linked_threat_ids"],"additionalProperties":false,"properties":{"feature_id":{"type":"string"},"feature_name":{"type":"string"},"feature_role":{"type":"string","enum":["CORE","SECONDARY"]},"feature_description":{"type":"string"},"archetype_codes":{"type":"array","items":{"type":"string"}},"archetype_labels":{"type":"array","items":{"type":"string"}},"surface_tokens":{"type":"array","items":{"type":"string"}},"evidence_quote":{"type":"string"},"feature_source_url":{"type":"string"},"linked_threat_ids":{"type":"array","items":{"type":"string"}}}}}};
const schema40 = {"type":"object","required":["feature_id","feature_name","feature_role","feature_description","archetype_codes","archetype_labels","surface_tokens","evidence_quote","feature_source_url","linked_threat_ids"],"additionalProperties":false,"properties":{"feature_id":{"type":"string"},"feature_name":{"type":"string"},"feature_role":{"type":"string","enum":["CORE","SECONDARY"]},"feature_description":{"type":"string"},"archetype_codes":{"type":"array","items":{"type":"string"}},"archetype_labels":{"type":"array","items":{"type":"string"}},"surface_tokens":{"type":"array","items":{"type":"string"}},"evidence_quote":{"type":"string"},"feature_source_url":{"type":"string"},"linked_threat_ids":{"type":"array","items":{"type":"string"}}}};

function validate25(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://interface-sandbox.local/schemas/targetFeatureProfile.schema.json" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate25.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.target_profile === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "target_profile"},message:"must have required property '"+"target_profile"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.primary_product === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "primary_product"},message:"must have required property '"+"primary_product"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.product_feature_map === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "product_feature_map"},message:"must have required property '"+"product_feature_map"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.raw_feature_candidates === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "raw_feature_candidates"},message:"must have required property '"+"raw_feature_candidates"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.feature_map_scratchpad === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "feature_map_scratchpad"},message:"must have required property '"+"feature_map_scratchpad"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.limitations === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "limitations"},message:"must have required property '"+"limitations"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "target_profile") || (key0 === "primary_product")) || (key0 === "product_feature_map")) || (key0 === "raw_feature_candidates")) || (key0 === "feature_map_scratchpad")) || (key0 === "limitations"))){
const err6 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.target_profile !== undefined){
let data0 = data.target_profile;
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
if(data0.company_name === undefined){
const err7 = {instancePath:instancePath+"/target_profile",schemaPath:"#/properties/target_profile/required",keyword:"required",params:{missingProperty: "company_name"},message:"must have required property '"+"company_name"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data0.website === undefined){
const err8 = {instancePath:instancePath+"/target_profile",schemaPath:"#/properties/target_profile/required",keyword:"required",params:{missingProperty: "website"},message:"must have required property '"+"website"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data0.legal_entity === undefined){
const err9 = {instancePath:instancePath+"/target_profile",schemaPath:"#/properties/target_profile/required",keyword:"required",params:{missingProperty: "legal_entity"},message:"must have required property '"+"legal_entity"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data0.hq_jurisdiction === undefined){
const err10 = {instancePath:instancePath+"/target_profile",schemaPath:"#/properties/target_profile/required",keyword:"required",params:{missingProperty: "hq_jurisdiction"},message:"must have required property '"+"hq_jurisdiction"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data0.actual_processing_location === undefined){
const err11 = {instancePath:instancePath+"/target_profile",schemaPath:"#/properties/target_profile/required",keyword:"required",params:{missingProperty: "actual_processing_location"},message:"must have required property '"+"actual_processing_location"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data0.data_sovereignty_signature === undefined){
const err12 = {instancePath:instancePath+"/target_profile",schemaPath:"#/properties/target_profile/required",keyword:"required",params:{missingProperty: "data_sovereignty_signature"},message:"must have required property '"+"data_sovereignty_signature"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data0.primary_claim === undefined){
const err13 = {instancePath:instancePath+"/target_profile",schemaPath:"#/properties/target_profile/required",keyword:"required",params:{missingProperty: "primary_claim"},message:"must have required property '"+"primary_claim"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
for(const key1 in data0){
if(!(((((((key1 === "company_name") || (key1 === "website")) || (key1 === "legal_entity")) || (key1 === "hq_jurisdiction")) || (key1 === "actual_processing_location")) || (key1 === "data_sovereignty_signature")) || (key1 === "primary_claim"))){
const err14 = {instancePath:instancePath+"/target_profile",schemaPath:"#/properties/target_profile/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data0.company_name !== undefined){
if(typeof data0.company_name !== "string"){
const err15 = {instancePath:instancePath+"/target_profile/company_name",schemaPath:"#/properties/target_profile/properties/company_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data0.website !== undefined){
if(typeof data0.website !== "string"){
const err16 = {instancePath:instancePath+"/target_profile/website",schemaPath:"#/properties/target_profile/properties/website/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data0.legal_entity !== undefined){
if(typeof data0.legal_entity !== "string"){
const err17 = {instancePath:instancePath+"/target_profile/legal_entity",schemaPath:"#/properties/target_profile/properties/legal_entity/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data0.hq_jurisdiction !== undefined){
if(typeof data0.hq_jurisdiction !== "string"){
const err18 = {instancePath:instancePath+"/target_profile/hq_jurisdiction",schemaPath:"#/properties/target_profile/properties/hq_jurisdiction/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data0.actual_processing_location !== undefined){
if(typeof data0.actual_processing_location !== "string"){
const err19 = {instancePath:instancePath+"/target_profile/actual_processing_location",schemaPath:"#/properties/target_profile/properties/actual_processing_location/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data0.data_sovereignty_signature !== undefined){
if(typeof data0.data_sovereignty_signature !== "string"){
const err20 = {instancePath:instancePath+"/target_profile/data_sovereignty_signature",schemaPath:"#/properties/target_profile/properties/data_sovereignty_signature/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data0.primary_claim !== undefined){
if(typeof data0.primary_claim !== "string"){
const err21 = {instancePath:instancePath+"/target_profile/primary_claim",schemaPath:"#/properties/target_profile/properties/primary_claim/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
}
else {
const err22 = {instancePath:instancePath+"/target_profile",schemaPath:"#/properties/target_profile/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.primary_product !== undefined){
let data8 = data.primary_product;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.product_name === undefined){
const err23 = {instancePath:instancePath+"/primary_product",schemaPath:"#/properties/primary_product/required",keyword:"required",params:{missingProperty: "product_name"},message:"must have required property '"+"product_name"+"'"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(data8.user === undefined){
const err24 = {instancePath:instancePath+"/primary_product",schemaPath:"#/properties/primary_product/required",keyword:"required",params:{missingProperty: "user"},message:"must have required property '"+"user"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(data8.function === undefined){
const err25 = {instancePath:instancePath+"/primary_product",schemaPath:"#/properties/primary_product/required",keyword:"required",params:{missingProperty: "function"},message:"must have required property '"+"function"+"'"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(data8.mechanism === undefined){
const err26 = {instancePath:instancePath+"/primary_product",schemaPath:"#/properties/primary_product/required",keyword:"required",params:{missingProperty: "mechanism"},message:"must have required property '"+"mechanism"+"'"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(data8.agent_actor === undefined){
const err27 = {instancePath:instancePath+"/primary_product",schemaPath:"#/properties/primary_product/required",keyword:"required",params:{missingProperty: "agent_actor"},message:"must have required property '"+"agent_actor"+"'"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(data8.agent_brand_name === undefined){
const err28 = {instancePath:instancePath+"/primary_product",schemaPath:"#/properties/primary_product/required",keyword:"required",params:{missingProperty: "agent_brand_name"},message:"must have required property '"+"agent_brand_name"+"'"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
for(const key2 in data8){
if(!((((((key2 === "product_name") || (key2 === "user")) || (key2 === "function")) || (key2 === "mechanism")) || (key2 === "agent_actor")) || (key2 === "agent_brand_name"))){
const err29 = {instancePath:instancePath+"/primary_product",schemaPath:"#/properties/primary_product/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data8.product_name !== undefined){
if(typeof data8.product_name !== "string"){
const err30 = {instancePath:instancePath+"/primary_product/product_name",schemaPath:"#/properties/primary_product/properties/product_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data8.user !== undefined){
if(typeof data8.user !== "string"){
const err31 = {instancePath:instancePath+"/primary_product/user",schemaPath:"#/properties/primary_product/properties/user/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data8.function !== undefined){
if(typeof data8.function !== "string"){
const err32 = {instancePath:instancePath+"/primary_product/function",schemaPath:"#/properties/primary_product/properties/function/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data8.mechanism !== undefined){
if(typeof data8.mechanism !== "string"){
const err33 = {instancePath:instancePath+"/primary_product/mechanism",schemaPath:"#/properties/primary_product/properties/mechanism/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data8.agent_actor !== undefined){
if(typeof data8.agent_actor !== "string"){
const err34 = {instancePath:instancePath+"/primary_product/agent_actor",schemaPath:"#/properties/primary_product/properties/agent_actor/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(data8.agent_brand_name !== undefined){
if(typeof data8.agent_brand_name !== "string"){
const err35 = {instancePath:instancePath+"/primary_product/agent_brand_name",schemaPath:"#/properties/primary_product/properties/agent_brand_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
}
else {
const err36 = {instancePath:instancePath+"/primary_product",schemaPath:"#/properties/primary_product/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data.product_feature_map !== undefined){
let data15 = data.product_feature_map;
if(Array.isArray(data15)){
const len0 = data15.length;
for(let i0=0; i0<len0; i0++){
let data16 = data15[i0];
if(data16 && typeof data16 == "object" && !Array.isArray(data16)){
if(data16.feature_id === undefined){
const err37 = {instancePath:instancePath+"/product_feature_map/" + i0,schemaPath:"#/$defs/feature/required",keyword:"required",params:{missingProperty: "feature_id"},message:"must have required property '"+"feature_id"+"'"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(data16.feature_name === undefined){
const err38 = {instancePath:instancePath+"/product_feature_map/" + i0,schemaPath:"#/$defs/feature/required",keyword:"required",params:{missingProperty: "feature_name"},message:"must have required property '"+"feature_name"+"'"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(data16.feature_role === undefined){
const err39 = {instancePath:instancePath+"/product_feature_map/" + i0,schemaPath:"#/$defs/feature/required",keyword:"required",params:{missingProperty: "feature_role"},message:"must have required property '"+"feature_role"+"'"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data16.feature_description === undefined){
const err40 = {instancePath:instancePath+"/product_feature_map/" + i0,schemaPath:"#/$defs/feature/required",keyword:"required",params:{missingProperty: "feature_description"},message:"must have required property '"+"feature_description"+"'"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(data16.archetype_codes === undefined){
const err41 = {instancePath:instancePath+"/product_feature_map/" + i0,schemaPath:"#/$defs/feature/required",keyword:"required",params:{missingProperty: "archetype_codes"},message:"must have required property '"+"archetype_codes"+"'"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(data16.archetype_labels === undefined){
const err42 = {instancePath:instancePath+"/product_feature_map/" + i0,schemaPath:"#/$defs/feature/required",keyword:"required",params:{missingProperty: "archetype_labels"},message:"must have required property '"+"archetype_labels"+"'"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(data16.surface_tokens === undefined){
const err43 = {instancePath:instancePath+"/product_feature_map/" + i0,schemaPath:"#/$defs/feature/required",keyword:"required",params:{missingProperty: "surface_tokens"},message:"must have required property '"+"surface_tokens"+"'"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(data16.evidence_quote === undefined){
const err44 = {instancePath:instancePath+"/product_feature_map/" + i0,schemaPath:"#/$defs/feature/required",keyword:"required",params:{missingProperty: "evidence_quote"},message:"must have required property '"+"evidence_quote"+"'"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(data16.feature_source_url === undefined){
const err45 = {instancePath:instancePath+"/product_feature_map/" + i0,schemaPath:"#/$defs/feature/required",keyword:"required",params:{missingProperty: "feature_source_url"},message:"must have required property '"+"feature_source_url"+"'"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(data16.linked_threat_ids === undefined){
const err46 = {instancePath:instancePath+"/product_feature_map/" + i0,schemaPath:"#/$defs/feature/required",keyword:"required",params:{missingProperty: "linked_threat_ids"},message:"must have required property '"+"linked_threat_ids"+"'"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
for(const key3 in data16){
if(!(func1.call(schema40.properties, key3))){
const err47 = {instancePath:instancePath+"/product_feature_map/" + i0,schemaPath:"#/$defs/feature/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
if(data16.feature_id !== undefined){
if(typeof data16.feature_id !== "string"){
const err48 = {instancePath:instancePath+"/product_feature_map/" + i0+"/feature_id",schemaPath:"#/$defs/feature/properties/feature_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
if(data16.feature_name !== undefined){
if(typeof data16.feature_name !== "string"){
const err49 = {instancePath:instancePath+"/product_feature_map/" + i0+"/feature_name",schemaPath:"#/$defs/feature/properties/feature_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
if(data16.feature_role !== undefined){
let data19 = data16.feature_role;
if(typeof data19 !== "string"){
const err50 = {instancePath:instancePath+"/product_feature_map/" + i0+"/feature_role",schemaPath:"#/$defs/feature/properties/feature_role/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if(!((data19 === "CORE") || (data19 === "SECONDARY"))){
const err51 = {instancePath:instancePath+"/product_feature_map/" + i0+"/feature_role",schemaPath:"#/$defs/feature/properties/feature_role/enum",keyword:"enum",params:{allowedValues: schema40.properties.feature_role.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
if(data16.feature_description !== undefined){
if(typeof data16.feature_description !== "string"){
const err52 = {instancePath:instancePath+"/product_feature_map/" + i0+"/feature_description",schemaPath:"#/$defs/feature/properties/feature_description/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
if(data16.archetype_codes !== undefined){
let data21 = data16.archetype_codes;
if(Array.isArray(data21)){
const len1 = data21.length;
for(let i1=0; i1<len1; i1++){
if(typeof data21[i1] !== "string"){
const err53 = {instancePath:instancePath+"/product_feature_map/" + i0+"/archetype_codes/" + i1,schemaPath:"#/$defs/feature/properties/archetype_codes/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
}
else {
const err54 = {instancePath:instancePath+"/product_feature_map/" + i0+"/archetype_codes",schemaPath:"#/$defs/feature/properties/archetype_codes/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
if(data16.archetype_labels !== undefined){
let data23 = data16.archetype_labels;
if(Array.isArray(data23)){
const len2 = data23.length;
for(let i2=0; i2<len2; i2++){
if(typeof data23[i2] !== "string"){
const err55 = {instancePath:instancePath+"/product_feature_map/" + i0+"/archetype_labels/" + i2,schemaPath:"#/$defs/feature/properties/archetype_labels/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
}
else {
const err56 = {instancePath:instancePath+"/product_feature_map/" + i0+"/archetype_labels",schemaPath:"#/$defs/feature/properties/archetype_labels/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
if(data16.surface_tokens !== undefined){
let data25 = data16.surface_tokens;
if(Array.isArray(data25)){
const len3 = data25.length;
for(let i3=0; i3<len3; i3++){
if(typeof data25[i3] !== "string"){
const err57 = {instancePath:instancePath+"/product_feature_map/" + i0+"/surface_tokens/" + i3,schemaPath:"#/$defs/feature/properties/surface_tokens/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
}
}
else {
const err58 = {instancePath:instancePath+"/product_feature_map/" + i0+"/surface_tokens",schemaPath:"#/$defs/feature/properties/surface_tokens/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
if(data16.evidence_quote !== undefined){
if(typeof data16.evidence_quote !== "string"){
const err59 = {instancePath:instancePath+"/product_feature_map/" + i0+"/evidence_quote",schemaPath:"#/$defs/feature/properties/evidence_quote/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
}
if(data16.feature_source_url !== undefined){
if(typeof data16.feature_source_url !== "string"){
const err60 = {instancePath:instancePath+"/product_feature_map/" + i0+"/feature_source_url",schemaPath:"#/$defs/feature/properties/feature_source_url/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
}
if(data16.linked_threat_ids !== undefined){
let data29 = data16.linked_threat_ids;
if(Array.isArray(data29)){
const len4 = data29.length;
for(let i4=0; i4<len4; i4++){
if(typeof data29[i4] !== "string"){
const err61 = {instancePath:instancePath+"/product_feature_map/" + i0+"/linked_threat_ids/" + i4,schemaPath:"#/$defs/feature/properties/linked_threat_ids/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
}
}
else {
const err62 = {instancePath:instancePath+"/product_feature_map/" + i0+"/linked_threat_ids",schemaPath:"#/$defs/feature/properties/linked_threat_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
}
}
else {
const err63 = {instancePath:instancePath+"/product_feature_map/" + i0,schemaPath:"#/$defs/feature/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
}
else {
const err64 = {instancePath:instancePath+"/product_feature_map",schemaPath:"#/properties/product_feature_map/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
}
if(data.raw_feature_candidates !== undefined){
let data31 = data.raw_feature_candidates;
if(Array.isArray(data31)){
const len5 = data31.length;
for(let i5=0; i5<len5; i5++){
let data32 = data31[i5];
if(data32 && typeof data32 == "object" && !Array.isArray(data32)){
}
else {
const err65 = {instancePath:instancePath+"/raw_feature_candidates/" + i5,schemaPath:"#/properties/raw_feature_candidates/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
}
}
else {
const err66 = {instancePath:instancePath+"/raw_feature_candidates",schemaPath:"#/properties/raw_feature_candidates/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
if(data.feature_map_scratchpad !== undefined){
let data33 = data.feature_map_scratchpad;
if(Array.isArray(data33)){
const len6 = data33.length;
for(let i6=0; i6<len6; i6++){
let data34 = data33[i6];
if(data34 && typeof data34 == "object" && !Array.isArray(data34)){
}
else {
const err67 = {instancePath:instancePath+"/feature_map_scratchpad/" + i6,schemaPath:"#/properties/feature_map_scratchpad/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
}
}
else {
const err68 = {instancePath:instancePath+"/feature_map_scratchpad",schemaPath:"#/properties/feature_map_scratchpad/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
}
if(data.limitations !== undefined){
let data35 = data.limitations;
if(Array.isArray(data35)){
const len7 = data35.length;
for(let i7=0; i7<len7; i7++){
if(typeof data35[i7] !== "string"){
const err69 = {instancePath:instancePath+"/limitations/" + i7,schemaPath:"#/properties/limitations/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
}
}
else {
const err70 = {instancePath:instancePath+"/limitations",schemaPath:"#/properties/limitations/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
}
}
else {
const err71 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
validate25.errors = vErrors;
return errors === 0;
}
validate25.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

export const validate_legalStackReview = validate26;
const schema41 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://interface-sandbox.local/schemas/legalStackReview.schema.json","title":"Legal Stack Review","description":"Canonical legal_stack_review produced by Stage 2. The legal_stack array must contain one entry for each document type: ToS, Privacy Policy, DPA, AUP, and SLA.","type":"object","required":["legal_stack","document_stack_redline","document_stack_synthesis","legal_stack_assessment","limitations"],"additionalProperties":false,"properties":{"legal_stack":{"type":"array","minItems":5,"maxItems":5,"items":{"$ref":"#/$defs/legalDocument"}},"document_stack_redline":{"type":"array","items":{"$ref":"#/$defs/redline"}},"document_stack_synthesis":{"type":"string"},"legal_stack_assessment":{"type":"array","items":{"type":"object","additionalProperties":true}},"limitations":{"type":"array","items":{"type":"string"}}},"$defs":{"legalDocument":{"type":"object","required":["document_type","exists","document_url","covers","misses","evidence_status","linked_threat_ids"],"additionalProperties":false,"properties":{"document_type":{"type":"string","enum":["ToS","Privacy Policy","DPA","AUP","SLA"]},"exists":{"type":"boolean"},"document_url":{"type":"string"},"covers":{"type":["array","null"],"items":{"type":"string"}},"misses":{"type":"array","items":{"type":"string"}},"evidence_status":{"type":"string","enum":["INGESTED","ABSENT","ACCESS_FAILED","INSUFFICIENT"]},"linked_threat_ids":{"type":"array","items":{"type":"string"}}},"allOf":[{"if":{"properties":{"exists":{"const":false}},"required":["exists"]},"then":{"properties":{"document_url":{"const":"N/A"},"covers":{"type":"null"}}}}]},"redline":{"type":"object","required":["mismatch_id","type","quote","source","feature_ref","claim_type","contradicts"],"additionalProperties":false,"properties":{"mismatch_id":{"type":"string"},"type":{"type":"string","enum":["QUOTE_VS_QUOTE","CLAIM_VS_ABSENCE","STACK_VS_REALITY"]},"quote":{"type":"string"},"source":{"type":"string"},"feature_ref":{"type":"string"},"claim_type":{"type":"string"},"contradicts":{"type":"string"}}}}};
const schema42 = {"type":"object","required":["document_type","exists","document_url","covers","misses","evidence_status","linked_threat_ids"],"additionalProperties":false,"properties":{"document_type":{"type":"string","enum":["ToS","Privacy Policy","DPA","AUP","SLA"]},"exists":{"type":"boolean"},"document_url":{"type":"string"},"covers":{"type":["array","null"],"items":{"type":"string"}},"misses":{"type":"array","items":{"type":"string"}},"evidence_status":{"type":"string","enum":["INGESTED","ABSENT","ACCESS_FAILED","INSUFFICIENT"]},"linked_threat_ids":{"type":"array","items":{"type":"string"}}},"allOf":[{"if":{"properties":{"exists":{"const":false}},"required":["exists"]},"then":{"properties":{"document_url":{"const":"N/A"},"covers":{"type":"null"}}}}]};
const schema43 = {"type":"object","required":["mismatch_id","type","quote","source","feature_ref","claim_type","contradicts"],"additionalProperties":false,"properties":{"mismatch_id":{"type":"string"},"type":{"type":"string","enum":["QUOTE_VS_QUOTE","CLAIM_VS_ABSENCE","STACK_VS_REALITY"]},"quote":{"type":"string"},"source":{"type":"string"},"feature_ref":{"type":"string"},"claim_type":{"type":"string"},"contradicts":{"type":"string"}}};

function validate26(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://interface-sandbox.local/schemas/legalStackReview.schema.json" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate26.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.legal_stack === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "legal_stack"},message:"must have required property '"+"legal_stack"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.document_stack_redline === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "document_stack_redline"},message:"must have required property '"+"document_stack_redline"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.document_stack_synthesis === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "document_stack_synthesis"},message:"must have required property '"+"document_stack_synthesis"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.legal_stack_assessment === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "legal_stack_assessment"},message:"must have required property '"+"legal_stack_assessment"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.limitations === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "limitations"},message:"must have required property '"+"limitations"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "legal_stack") || (key0 === "document_stack_redline")) || (key0 === "document_stack_synthesis")) || (key0 === "legal_stack_assessment")) || (key0 === "limitations"))){
const err5 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.legal_stack !== undefined){
let data0 = data.legal_stack;
if(Array.isArray(data0)){
if(data0.length > 5){
const err6 = {instancePath:instancePath+"/legal_stack",schemaPath:"#/properties/legal_stack/maxItems",keyword:"maxItems",params:{limit: 5},message:"must NOT have more than 5 items"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data0.length < 5){
const err7 = {instancePath:instancePath+"/legal_stack",schemaPath:"#/properties/legal_stack/minItems",keyword:"minItems",params:{limit: 5},message:"must NOT have fewer than 5 items"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
const len0 = data0.length;
for(let i0=0; i0<len0; i0++){
let data1 = data0[i0];
const _errs8 = errors;
let valid5 = true;
const _errs9 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
let missing0;
if((data1.exists === undefined) && (missing0 = "exists")){
const err8 = {};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
else {
if(data1.exists !== undefined){
if(false !== data1.exists){
const err9 = {};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
}
}
var _valid0 = _errs9 === errors;
errors = _errs8;
if(vErrors !== null){
if(_errs8){
vErrors.length = _errs8;
}
else {
vErrors = null;
}
}
if(_valid0){
const _errs11 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.document_url !== undefined){
if("N/A" !== data1.document_url){
const err10 = {instancePath:instancePath+"/legal_stack/" + i0+"/document_url",schemaPath:"#/$defs/legalDocument/allOf/0/then/properties/document_url/const",keyword:"const",params:{allowedValue: "N/A"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data1.covers !== undefined){
if(data1.covers !== null){
const err11 = {instancePath:instancePath+"/legal_stack/" + i0+"/covers",schemaPath:"#/$defs/legalDocument/allOf/0/then/properties/covers/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
}
var _valid0 = _errs11 === errors;
valid5 = _valid0;
if(valid5){
var props0 = {};
props0.document_url = true;
props0.covers = true;
props0.exists = true;
}
}
if(!valid5){
const err12 = {instancePath:instancePath+"/legal_stack/" + i0,schemaPath:"#/$defs/legalDocument/allOf/0/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.document_type === undefined){
const err13 = {instancePath:instancePath+"/legal_stack/" + i0,schemaPath:"#/$defs/legalDocument/required",keyword:"required",params:{missingProperty: "document_type"},message:"must have required property '"+"document_type"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data1.exists === undefined){
const err14 = {instancePath:instancePath+"/legal_stack/" + i0,schemaPath:"#/$defs/legalDocument/required",keyword:"required",params:{missingProperty: "exists"},message:"must have required property '"+"exists"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data1.document_url === undefined){
const err15 = {instancePath:instancePath+"/legal_stack/" + i0,schemaPath:"#/$defs/legalDocument/required",keyword:"required",params:{missingProperty: "document_url"},message:"must have required property '"+"document_url"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data1.covers === undefined){
const err16 = {instancePath:instancePath+"/legal_stack/" + i0,schemaPath:"#/$defs/legalDocument/required",keyword:"required",params:{missingProperty: "covers"},message:"must have required property '"+"covers"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data1.misses === undefined){
const err17 = {instancePath:instancePath+"/legal_stack/" + i0,schemaPath:"#/$defs/legalDocument/required",keyword:"required",params:{missingProperty: "misses"},message:"must have required property '"+"misses"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data1.evidence_status === undefined){
const err18 = {instancePath:instancePath+"/legal_stack/" + i0,schemaPath:"#/$defs/legalDocument/required",keyword:"required",params:{missingProperty: "evidence_status"},message:"must have required property '"+"evidence_status"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data1.linked_threat_ids === undefined){
const err19 = {instancePath:instancePath+"/legal_stack/" + i0,schemaPath:"#/$defs/legalDocument/required",keyword:"required",params:{missingProperty: "linked_threat_ids"},message:"must have required property '"+"linked_threat_ids"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
for(const key1 in data1){
if(!(((((((key1 === "document_type") || (key1 === "exists")) || (key1 === "document_url")) || (key1 === "covers")) || (key1 === "misses")) || (key1 === "evidence_status")) || (key1 === "linked_threat_ids"))){
const err20 = {instancePath:instancePath+"/legal_stack/" + i0,schemaPath:"#/$defs/legalDocument/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data1.document_type !== undefined){
let data5 = data1.document_type;
if(typeof data5 !== "string"){
const err21 = {instancePath:instancePath+"/legal_stack/" + i0+"/document_type",schemaPath:"#/$defs/legalDocument/properties/document_type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(!(((((data5 === "ToS") || (data5 === "Privacy Policy")) || (data5 === "DPA")) || (data5 === "AUP")) || (data5 === "SLA"))){
const err22 = {instancePath:instancePath+"/legal_stack/" + i0+"/document_type",schemaPath:"#/$defs/legalDocument/properties/document_type/enum",keyword:"enum",params:{allowedValues: schema42.properties.document_type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data1.exists !== undefined){
if(typeof data1.exists !== "boolean"){
const err23 = {instancePath:instancePath+"/legal_stack/" + i0+"/exists",schemaPath:"#/$defs/legalDocument/properties/exists/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data1.document_url !== undefined){
if(typeof data1.document_url !== "string"){
const err24 = {instancePath:instancePath+"/legal_stack/" + i0+"/document_url",schemaPath:"#/$defs/legalDocument/properties/document_url/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data1.covers !== undefined){
let data8 = data1.covers;
if((!(Array.isArray(data8))) && (data8 !== null)){
const err25 = {instancePath:instancePath+"/legal_stack/" + i0+"/covers",schemaPath:"#/$defs/legalDocument/properties/covers/type",keyword:"type",params:{type: schema42.properties.covers.type},message:"must be array,null"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(Array.isArray(data8)){
const len1 = data8.length;
for(let i1=0; i1<len1; i1++){
if(typeof data8[i1] !== "string"){
const err26 = {instancePath:instancePath+"/legal_stack/" + i0+"/covers/" + i1,schemaPath:"#/$defs/legalDocument/properties/covers/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
}
}
if(data1.misses !== undefined){
let data10 = data1.misses;
if(Array.isArray(data10)){
const len2 = data10.length;
for(let i2=0; i2<len2; i2++){
if(typeof data10[i2] !== "string"){
const err27 = {instancePath:instancePath+"/legal_stack/" + i0+"/misses/" + i2,schemaPath:"#/$defs/legalDocument/properties/misses/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
}
else {
const err28 = {instancePath:instancePath+"/legal_stack/" + i0+"/misses",schemaPath:"#/$defs/legalDocument/properties/misses/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data1.evidence_status !== undefined){
let data12 = data1.evidence_status;
if(typeof data12 !== "string"){
const err29 = {instancePath:instancePath+"/legal_stack/" + i0+"/evidence_status",schemaPath:"#/$defs/legalDocument/properties/evidence_status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(!((((data12 === "INGESTED") || (data12 === "ABSENT")) || (data12 === "ACCESS_FAILED")) || (data12 === "INSUFFICIENT"))){
const err30 = {instancePath:instancePath+"/legal_stack/" + i0+"/evidence_status",schemaPath:"#/$defs/legalDocument/properties/evidence_status/enum",keyword:"enum",params:{allowedValues: schema42.properties.evidence_status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data1.linked_threat_ids !== undefined){
let data13 = data1.linked_threat_ids;
if(Array.isArray(data13)){
const len3 = data13.length;
for(let i3=0; i3<len3; i3++){
if(typeof data13[i3] !== "string"){
const err31 = {instancePath:instancePath+"/legal_stack/" + i0+"/linked_threat_ids/" + i3,schemaPath:"#/$defs/legalDocument/properties/linked_threat_ids/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
}
else {
const err32 = {instancePath:instancePath+"/legal_stack/" + i0+"/linked_threat_ids",schemaPath:"#/$defs/legalDocument/properties/linked_threat_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
}
else {
const err33 = {instancePath:instancePath+"/legal_stack/" + i0,schemaPath:"#/$defs/legalDocument/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
}
else {
const err34 = {instancePath:instancePath+"/legal_stack",schemaPath:"#/properties/legal_stack/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(data.document_stack_redline !== undefined){
let data15 = data.document_stack_redline;
if(Array.isArray(data15)){
const len4 = data15.length;
for(let i4=0; i4<len4; i4++){
let data16 = data15[i4];
if(data16 && typeof data16 == "object" && !Array.isArray(data16)){
if(data16.mismatch_id === undefined){
const err35 = {instancePath:instancePath+"/document_stack_redline/" + i4,schemaPath:"#/$defs/redline/required",keyword:"required",params:{missingProperty: "mismatch_id"},message:"must have required property '"+"mismatch_id"+"'"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(data16.type === undefined){
const err36 = {instancePath:instancePath+"/document_stack_redline/" + i4,schemaPath:"#/$defs/redline/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(data16.quote === undefined){
const err37 = {instancePath:instancePath+"/document_stack_redline/" + i4,schemaPath:"#/$defs/redline/required",keyword:"required",params:{missingProperty: "quote"},message:"must have required property '"+"quote"+"'"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(data16.source === undefined){
const err38 = {instancePath:instancePath+"/document_stack_redline/" + i4,schemaPath:"#/$defs/redline/required",keyword:"required",params:{missingProperty: "source"},message:"must have required property '"+"source"+"'"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(data16.feature_ref === undefined){
const err39 = {instancePath:instancePath+"/document_stack_redline/" + i4,schemaPath:"#/$defs/redline/required",keyword:"required",params:{missingProperty: "feature_ref"},message:"must have required property '"+"feature_ref"+"'"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data16.claim_type === undefined){
const err40 = {instancePath:instancePath+"/document_stack_redline/" + i4,schemaPath:"#/$defs/redline/required",keyword:"required",params:{missingProperty: "claim_type"},message:"must have required property '"+"claim_type"+"'"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(data16.contradicts === undefined){
const err41 = {instancePath:instancePath+"/document_stack_redline/" + i4,schemaPath:"#/$defs/redline/required",keyword:"required",params:{missingProperty: "contradicts"},message:"must have required property '"+"contradicts"+"'"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
for(const key2 in data16){
if(!(((((((key2 === "mismatch_id") || (key2 === "type")) || (key2 === "quote")) || (key2 === "source")) || (key2 === "feature_ref")) || (key2 === "claim_type")) || (key2 === "contradicts"))){
const err42 = {instancePath:instancePath+"/document_stack_redline/" + i4,schemaPath:"#/$defs/redline/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data16.mismatch_id !== undefined){
if(typeof data16.mismatch_id !== "string"){
const err43 = {instancePath:instancePath+"/document_stack_redline/" + i4+"/mismatch_id",schemaPath:"#/$defs/redline/properties/mismatch_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
if(data16.type !== undefined){
let data18 = data16.type;
if(typeof data18 !== "string"){
const err44 = {instancePath:instancePath+"/document_stack_redline/" + i4+"/type",schemaPath:"#/$defs/redline/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(!(((data18 === "QUOTE_VS_QUOTE") || (data18 === "CLAIM_VS_ABSENCE")) || (data18 === "STACK_VS_REALITY"))){
const err45 = {instancePath:instancePath+"/document_stack_redline/" + i4+"/type",schemaPath:"#/$defs/redline/properties/type/enum",keyword:"enum",params:{allowedValues: schema43.properties.type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(data16.quote !== undefined){
if(typeof data16.quote !== "string"){
const err46 = {instancePath:instancePath+"/document_stack_redline/" + i4+"/quote",schemaPath:"#/$defs/redline/properties/quote/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
if(data16.source !== undefined){
if(typeof data16.source !== "string"){
const err47 = {instancePath:instancePath+"/document_stack_redline/" + i4+"/source",schemaPath:"#/$defs/redline/properties/source/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
if(data16.feature_ref !== undefined){
if(typeof data16.feature_ref !== "string"){
const err48 = {instancePath:instancePath+"/document_stack_redline/" + i4+"/feature_ref",schemaPath:"#/$defs/redline/properties/feature_ref/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
if(data16.claim_type !== undefined){
if(typeof data16.claim_type !== "string"){
const err49 = {instancePath:instancePath+"/document_stack_redline/" + i4+"/claim_type",schemaPath:"#/$defs/redline/properties/claim_type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
if(data16.contradicts !== undefined){
if(typeof data16.contradicts !== "string"){
const err50 = {instancePath:instancePath+"/document_stack_redline/" + i4+"/contradicts",schemaPath:"#/$defs/redline/properties/contradicts/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
}
else {
const err51 = {instancePath:instancePath+"/document_stack_redline/" + i4,schemaPath:"#/$defs/redline/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
}
else {
const err52 = {instancePath:instancePath+"/document_stack_redline",schemaPath:"#/properties/document_stack_redline/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
if(data.document_stack_synthesis !== undefined){
if(typeof data.document_stack_synthesis !== "string"){
const err53 = {instancePath:instancePath+"/document_stack_synthesis",schemaPath:"#/properties/document_stack_synthesis/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
if(data.legal_stack_assessment !== undefined){
let data25 = data.legal_stack_assessment;
if(Array.isArray(data25)){
const len5 = data25.length;
for(let i5=0; i5<len5; i5++){
let data26 = data25[i5];
if(data26 && typeof data26 == "object" && !Array.isArray(data26)){
}
else {
const err54 = {instancePath:instancePath+"/legal_stack_assessment/" + i5,schemaPath:"#/properties/legal_stack_assessment/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
}
else {
const err55 = {instancePath:instancePath+"/legal_stack_assessment",schemaPath:"#/properties/legal_stack_assessment/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
if(data.limitations !== undefined){
let data27 = data.limitations;
if(Array.isArray(data27)){
const len6 = data27.length;
for(let i6=0; i6<len6; i6++){
if(typeof data27[i6] !== "string"){
const err56 = {instancePath:instancePath+"/limitations/" + i6,schemaPath:"#/properties/limitations/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
}
else {
const err57 = {instancePath:instancePath+"/limitations",schemaPath:"#/properties/limitations/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
}
}
else {
const err58 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
validate26.errors = vErrors;
return errors === 0;
}
validate26.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

export const validate_registryLedger = validate27;
const schema44 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://interface-sandbox.local/schemas/registryLedger.schema.json","title":"Registry Evaluation Ledger","description":"Canonical registry_evaluation_ledger. After merge, ledger length must equal the active loaded registry row count; this schema does not hardcode the current artifact row count.","type":"object","required":["registry_batch_meta","registry_evaluation_ledger","batch_warnings"],"additionalProperties":false,"properties":{"registry_batch_meta":{"type":"object","required":["run_id","registry_count_loaded"],"additionalProperties":true,"properties":{"run_id":{"type":"string"},"registry_count_loaded":{"type":"integer","minimum":0},"batch_id":{"type":"string"}}},"registry_evaluation_ledger":{"type":"array","items":{"$ref":"#/$defs/ledgerEntry"}},"registry_batch_evaluation":{"type":"array","items":{"$ref":"#/$defs/ledgerEntry"}},"batch_warnings":{"type":"array","items":{"type":"string"}}},"$defs":{"condition":{"type":"object","required":["condition_id","result","basis"],"additionalProperties":false,"properties":{"condition_id":{"type":"string"},"result":{"type":"boolean"},"basis":{"type":"string"}}},"ledgerEntry":{"type":"object","required":["entry_number","threat_id","threat_name","conditions","trigger_if_result","exclude_if_result","final_status","feature_refs","evidence_ref","reasoning_summary"],"additionalProperties":false,"properties":{"entry_number":{"type":"integer","minimum":1},"threat_id":{"type":"string"},"threat_name":{"type":"string"},"archetype_gate":{"type":"string"},"surface_gate":{"type":"string"},"authority_relevance":{"type":"string"},"conditions":{"type":"array","items":{"$ref":"#/$defs/condition"}},"trigger_if_result":{"type":"boolean"},"exclude_if_result":{"type":"boolean"},"final_status":{"type":"string","enum":["TRIGGERED","CONTROLLED","NOT_TRIGGERED","NOT_APPLICABLE","INSUFFICIENT_EVIDENCE"]},"feature_refs":{"type":"array","items":{"type":"string"}},"evidence_ref":{"type":"string"},"reasoning_summary":{"type":"string"}}}}};
const schema45 = {"type":"object","required":["entry_number","threat_id","threat_name","conditions","trigger_if_result","exclude_if_result","final_status","feature_refs","evidence_ref","reasoning_summary"],"additionalProperties":false,"properties":{"entry_number":{"type":"integer","minimum":1},"threat_id":{"type":"string"},"threat_name":{"type":"string"},"archetype_gate":{"type":"string"},"surface_gate":{"type":"string"},"authority_relevance":{"type":"string"},"conditions":{"type":"array","items":{"$ref":"#/$defs/condition"}},"trigger_if_result":{"type":"boolean"},"exclude_if_result":{"type":"boolean"},"final_status":{"type":"string","enum":["TRIGGERED","CONTROLLED","NOT_TRIGGERED","NOT_APPLICABLE","INSUFFICIENT_EVIDENCE"]},"feature_refs":{"type":"array","items":{"type":"string"}},"evidence_ref":{"type":"string"},"reasoning_summary":{"type":"string"}}};
const schema46 = {"type":"object","required":["condition_id","result","basis"],"additionalProperties":false,"properties":{"condition_id":{"type":"string"},"result":{"type":"boolean"},"basis":{"type":"string"}}};

function validate28(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate28.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.entry_number === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "entry_number"},message:"must have required property '"+"entry_number"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.threat_id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "threat_id"},message:"must have required property '"+"threat_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.threat_name === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "threat_name"},message:"must have required property '"+"threat_name"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.conditions === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "conditions"},message:"must have required property '"+"conditions"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.trigger_if_result === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "trigger_if_result"},message:"must have required property '"+"trigger_if_result"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.exclude_if_result === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "exclude_if_result"},message:"must have required property '"+"exclude_if_result"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.final_status === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "final_status"},message:"must have required property '"+"final_status"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.feature_refs === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "feature_refs"},message:"must have required property '"+"feature_refs"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.evidence_ref === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence_ref"},message:"must have required property '"+"evidence_ref"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.reasoning_summary === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "reasoning_summary"},message:"must have required property '"+"reasoning_summary"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema45.properties, key0))){
const err10 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.entry_number !== undefined){
let data0 = data.entry_number;
if(!((typeof data0 == "number") && (!(data0 % 1) && !isNaN(data0)))){
const err11 = {instancePath:instancePath+"/entry_number",schemaPath:"#/properties/entry_number/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(typeof data0 == "number"){
if(data0 < 1 || isNaN(data0)){
const err12 = {instancePath:instancePath+"/entry_number",schemaPath:"#/properties/entry_number/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
}
if(data.threat_id !== undefined){
if(typeof data.threat_id !== "string"){
const err13 = {instancePath:instancePath+"/threat_id",schemaPath:"#/properties/threat_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.threat_name !== undefined){
if(typeof data.threat_name !== "string"){
const err14 = {instancePath:instancePath+"/threat_name",schemaPath:"#/properties/threat_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.archetype_gate !== undefined){
if(typeof data.archetype_gate !== "string"){
const err15 = {instancePath:instancePath+"/archetype_gate",schemaPath:"#/properties/archetype_gate/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.surface_gate !== undefined){
if(typeof data.surface_gate !== "string"){
const err16 = {instancePath:instancePath+"/surface_gate",schemaPath:"#/properties/surface_gate/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.authority_relevance !== undefined){
if(typeof data.authority_relevance !== "string"){
const err17 = {instancePath:instancePath+"/authority_relevance",schemaPath:"#/properties/authority_relevance/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.conditions !== undefined){
let data6 = data.conditions;
if(Array.isArray(data6)){
const len0 = data6.length;
for(let i0=0; i0<len0; i0++){
let data7 = data6[i0];
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
if(data7.condition_id === undefined){
const err18 = {instancePath:instancePath+"/conditions/" + i0,schemaPath:"#/$defs/condition/required",keyword:"required",params:{missingProperty: "condition_id"},message:"must have required property '"+"condition_id"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data7.result === undefined){
const err19 = {instancePath:instancePath+"/conditions/" + i0,schemaPath:"#/$defs/condition/required",keyword:"required",params:{missingProperty: "result"},message:"must have required property '"+"result"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data7.basis === undefined){
const err20 = {instancePath:instancePath+"/conditions/" + i0,schemaPath:"#/$defs/condition/required",keyword:"required",params:{missingProperty: "basis"},message:"must have required property '"+"basis"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
for(const key1 in data7){
if(!(((key1 === "condition_id") || (key1 === "result")) || (key1 === "basis"))){
const err21 = {instancePath:instancePath+"/conditions/" + i0,schemaPath:"#/$defs/condition/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data7.condition_id !== undefined){
if(typeof data7.condition_id !== "string"){
const err22 = {instancePath:instancePath+"/conditions/" + i0+"/condition_id",schemaPath:"#/$defs/condition/properties/condition_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data7.result !== undefined){
if(typeof data7.result !== "boolean"){
const err23 = {instancePath:instancePath+"/conditions/" + i0+"/result",schemaPath:"#/$defs/condition/properties/result/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data7.basis !== undefined){
if(typeof data7.basis !== "string"){
const err24 = {instancePath:instancePath+"/conditions/" + i0+"/basis",schemaPath:"#/$defs/condition/properties/basis/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
}
else {
const err25 = {instancePath:instancePath+"/conditions/" + i0,schemaPath:"#/$defs/condition/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
}
else {
const err26 = {instancePath:instancePath+"/conditions",schemaPath:"#/properties/conditions/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data.trigger_if_result !== undefined){
if(typeof data.trigger_if_result !== "boolean"){
const err27 = {instancePath:instancePath+"/trigger_if_result",schemaPath:"#/properties/trigger_if_result/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.exclude_if_result !== undefined){
if(typeof data.exclude_if_result !== "boolean"){
const err28 = {instancePath:instancePath+"/exclude_if_result",schemaPath:"#/properties/exclude_if_result/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data.final_status !== undefined){
let data13 = data.final_status;
if(typeof data13 !== "string"){
const err29 = {instancePath:instancePath+"/final_status",schemaPath:"#/properties/final_status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(!(((((data13 === "TRIGGERED") || (data13 === "CONTROLLED")) || (data13 === "NOT_TRIGGERED")) || (data13 === "NOT_APPLICABLE")) || (data13 === "INSUFFICIENT_EVIDENCE"))){
const err30 = {instancePath:instancePath+"/final_status",schemaPath:"#/properties/final_status/enum",keyword:"enum",params:{allowedValues: schema45.properties.final_status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data.feature_refs !== undefined){
let data14 = data.feature_refs;
if(Array.isArray(data14)){
const len1 = data14.length;
for(let i1=0; i1<len1; i1++){
if(typeof data14[i1] !== "string"){
const err31 = {instancePath:instancePath+"/feature_refs/" + i1,schemaPath:"#/properties/feature_refs/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
}
else {
const err32 = {instancePath:instancePath+"/feature_refs",schemaPath:"#/properties/feature_refs/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data.evidence_ref !== undefined){
if(typeof data.evidence_ref !== "string"){
const err33 = {instancePath:instancePath+"/evidence_ref",schemaPath:"#/properties/evidence_ref/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data.reasoning_summary !== undefined){
if(typeof data.reasoning_summary !== "string"){
const err34 = {instancePath:instancePath+"/reasoning_summary",schemaPath:"#/properties/reasoning_summary/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
}
else {
const err35 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
validate28.errors = vErrors;
return errors === 0;
}
validate28.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate27(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://interface-sandbox.local/schemas/registryLedger.schema.json" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate27.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.registry_batch_meta === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "registry_batch_meta"},message:"must have required property '"+"registry_batch_meta"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.registry_evaluation_ledger === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "registry_evaluation_ledger"},message:"must have required property '"+"registry_evaluation_ledger"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.batch_warnings === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "batch_warnings"},message:"must have required property '"+"batch_warnings"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "registry_batch_meta") || (key0 === "registry_evaluation_ledger")) || (key0 === "registry_batch_evaluation")) || (key0 === "batch_warnings"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.registry_batch_meta !== undefined){
let data0 = data.registry_batch_meta;
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
if(data0.run_id === undefined){
const err4 = {instancePath:instancePath+"/registry_batch_meta",schemaPath:"#/properties/registry_batch_meta/required",keyword:"required",params:{missingProperty: "run_id"},message:"must have required property '"+"run_id"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data0.registry_count_loaded === undefined){
const err5 = {instancePath:instancePath+"/registry_batch_meta",schemaPath:"#/properties/registry_batch_meta/required",keyword:"required",params:{missingProperty: "registry_count_loaded"},message:"must have required property '"+"registry_count_loaded"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data0.run_id !== undefined){
if(typeof data0.run_id !== "string"){
const err6 = {instancePath:instancePath+"/registry_batch_meta/run_id",schemaPath:"#/properties/registry_batch_meta/properties/run_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data0.registry_count_loaded !== undefined){
let data2 = data0.registry_count_loaded;
if(!((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2)))){
const err7 = {instancePath:instancePath+"/registry_batch_meta/registry_count_loaded",schemaPath:"#/properties/registry_batch_meta/properties/registry_count_loaded/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(typeof data2 == "number"){
if(data2 < 0 || isNaN(data2)){
const err8 = {instancePath:instancePath+"/registry_batch_meta/registry_count_loaded",schemaPath:"#/properties/registry_batch_meta/properties/registry_count_loaded/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
}
if(data0.batch_id !== undefined){
if(typeof data0.batch_id !== "string"){
const err9 = {instancePath:instancePath+"/registry_batch_meta/batch_id",schemaPath:"#/properties/registry_batch_meta/properties/batch_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
}
else {
const err10 = {instancePath:instancePath+"/registry_batch_meta",schemaPath:"#/properties/registry_batch_meta/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.registry_evaluation_ledger !== undefined){
let data4 = data.registry_evaluation_ledger;
if(Array.isArray(data4)){
const len0 = data4.length;
for(let i0=0; i0<len0; i0++){
if(!(validate28(data4[i0], {instancePath:instancePath+"/registry_evaluation_ledger/" + i0,parentData:data4,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate28.errors : vErrors.concat(validate28.errors);
errors = vErrors.length;
}
}
}
else {
const err11 = {instancePath:instancePath+"/registry_evaluation_ledger",schemaPath:"#/properties/registry_evaluation_ledger/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.registry_batch_evaluation !== undefined){
let data6 = data.registry_batch_evaluation;
if(Array.isArray(data6)){
const len1 = data6.length;
for(let i1=0; i1<len1; i1++){
if(!(validate28(data6[i1], {instancePath:instancePath+"/registry_batch_evaluation/" + i1,parentData:data6,parentDataProperty:i1,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate28.errors : vErrors.concat(validate28.errors);
errors = vErrors.length;
}
}
}
else {
const err12 = {instancePath:instancePath+"/registry_batch_evaluation",schemaPath:"#/properties/registry_batch_evaluation/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.batch_warnings !== undefined){
let data8 = data.batch_warnings;
if(Array.isArray(data8)){
const len2 = data8.length;
for(let i2=0; i2<len2; i2++){
if(typeof data8[i2] !== "string"){
const err13 = {instancePath:instancePath+"/batch_warnings/" + i2,schemaPath:"#/properties/batch_warnings/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
}
else {
const err14 = {instancePath:instancePath+"/batch_warnings",schemaPath:"#/properties/batch_warnings/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
}
else {
const err15 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
validate27.errors = vErrors;
return errors === 0;
}
validate27.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

export const validate_operatorChallenge = validate31;
const schema47 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://interface-sandbox.local/schemas/operatorChallenge.schema.json","title":"Operator Challenge Gate","description":"Canonical operator_challenge_gate produced by Stage 4 and used to verify or reopen registry ledger rows.","type":"object","required":["operator_challenge_gate","corrected_ledger_entries"],"additionalProperties":false,"properties":{"operator_challenge_gate":{"type":"object","required":["completed","result","registry_count_loaded","registry_count_evaluated","reopened_rows","high_risk_checks","notes"],"additionalProperties":false,"properties":{"completed":{"type":"boolean"},"result":{"type":"string","enum":["PASS","PASS_WITH_WARNINGS","REOPENED","FAIL_RETRY_REQUIRED"]},"registry_count_loaded":{"type":"integer","minimum":0},"registry_count_evaluated":{"type":"integer","minimum":0},"reopened_rows":{"type":"array","items":{"type":"object","required":["threat_id","previous_status","reopened_status","reason","required_action"],"additionalProperties":false,"properties":{"threat_id":{"type":"string"},"previous_status":{"$ref":"#/$defs/finalStatus"},"reopened_status":{"$ref":"#/$defs/finalStatus"},"reason":{"type":"string"},"required_action":{"type":"string"}}}},"high_risk_checks":{"type":"object","additionalProperties":true},"notes":{"type":"array","items":{"type":"string"}}}},"corrected_ledger_entries":{"type":"array","items":{"$ref":"#/$defs/ledgerEntry"}}},"$defs":{"finalStatus":{"type":"string","enum":["TRIGGERED","CONTROLLED","NOT_TRIGGERED","NOT_APPLICABLE","INSUFFICIENT_EVIDENCE"]},"ledgerEntry":{"type":"object","required":["entry_number","threat_id","threat_name","conditions","trigger_if_result","exclude_if_result","final_status","feature_refs","evidence_ref","reasoning_summary"],"additionalProperties":true,"properties":{"entry_number":{"type":"integer","minimum":1},"threat_id":{"type":"string"},"threat_name":{"type":"string"},"conditions":{"type":"array","items":{"type":"object"}},"trigger_if_result":{"type":"boolean"},"exclude_if_result":{"type":"boolean"},"final_status":{"$ref":"#/$defs/finalStatus"},"feature_refs":{"type":"array","items":{"type":"string"}},"evidence_ref":{"type":"string"},"reasoning_summary":{"type":"string"}}}}};
const schema48 = {"type":"string","enum":["TRIGGERED","CONTROLLED","NOT_TRIGGERED","NOT_APPLICABLE","INSUFFICIENT_EVIDENCE"]};
const schema50 = {"type":"object","required":["entry_number","threat_id","threat_name","conditions","trigger_if_result","exclude_if_result","final_status","feature_refs","evidence_ref","reasoning_summary"],"additionalProperties":true,"properties":{"entry_number":{"type":"integer","minimum":1},"threat_id":{"type":"string"},"threat_name":{"type":"string"},"conditions":{"type":"array","items":{"type":"object"}},"trigger_if_result":{"type":"boolean"},"exclude_if_result":{"type":"boolean"},"final_status":{"$ref":"#/$defs/finalStatus"},"feature_refs":{"type":"array","items":{"type":"string"}},"evidence_ref":{"type":"string"},"reasoning_summary":{"type":"string"}}};

function validate32(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate32.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.entry_number === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "entry_number"},message:"must have required property '"+"entry_number"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.threat_id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "threat_id"},message:"must have required property '"+"threat_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.threat_name === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "threat_name"},message:"must have required property '"+"threat_name"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.conditions === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "conditions"},message:"must have required property '"+"conditions"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.trigger_if_result === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "trigger_if_result"},message:"must have required property '"+"trigger_if_result"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.exclude_if_result === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "exclude_if_result"},message:"must have required property '"+"exclude_if_result"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.final_status === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "final_status"},message:"must have required property '"+"final_status"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.feature_refs === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "feature_refs"},message:"must have required property '"+"feature_refs"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.evidence_ref === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence_ref"},message:"must have required property '"+"evidence_ref"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.reasoning_summary === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "reasoning_summary"},message:"must have required property '"+"reasoning_summary"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.entry_number !== undefined){
let data0 = data.entry_number;
if(!((typeof data0 == "number") && (!(data0 % 1) && !isNaN(data0)))){
const err10 = {instancePath:instancePath+"/entry_number",schemaPath:"#/properties/entry_number/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(typeof data0 == "number"){
if(data0 < 1 || isNaN(data0)){
const err11 = {instancePath:instancePath+"/entry_number",schemaPath:"#/properties/entry_number/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
}
if(data.threat_id !== undefined){
if(typeof data.threat_id !== "string"){
const err12 = {instancePath:instancePath+"/threat_id",schemaPath:"#/properties/threat_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.threat_name !== undefined){
if(typeof data.threat_name !== "string"){
const err13 = {instancePath:instancePath+"/threat_name",schemaPath:"#/properties/threat_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.conditions !== undefined){
let data3 = data.conditions;
if(Array.isArray(data3)){
const len0 = data3.length;
for(let i0=0; i0<len0; i0++){
let data4 = data3[i0];
if(!(data4 && typeof data4 == "object" && !Array.isArray(data4))){
const err14 = {instancePath:instancePath+"/conditions/" + i0,schemaPath:"#/properties/conditions/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
}
else {
const err15 = {instancePath:instancePath+"/conditions",schemaPath:"#/properties/conditions/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.trigger_if_result !== undefined){
if(typeof data.trigger_if_result !== "boolean"){
const err16 = {instancePath:instancePath+"/trigger_if_result",schemaPath:"#/properties/trigger_if_result/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.exclude_if_result !== undefined){
if(typeof data.exclude_if_result !== "boolean"){
const err17 = {instancePath:instancePath+"/exclude_if_result",schemaPath:"#/properties/exclude_if_result/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.final_status !== undefined){
let data7 = data.final_status;
if(typeof data7 !== "string"){
const err18 = {instancePath:instancePath+"/final_status",schemaPath:"#/$defs/finalStatus/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(!(((((data7 === "TRIGGERED") || (data7 === "CONTROLLED")) || (data7 === "NOT_TRIGGERED")) || (data7 === "NOT_APPLICABLE")) || (data7 === "INSUFFICIENT_EVIDENCE"))){
const err19 = {instancePath:instancePath+"/final_status",schemaPath:"#/$defs/finalStatus/enum",keyword:"enum",params:{allowedValues: schema48.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.feature_refs !== undefined){
let data8 = data.feature_refs;
if(Array.isArray(data8)){
const len1 = data8.length;
for(let i1=0; i1<len1; i1++){
if(typeof data8[i1] !== "string"){
const err20 = {instancePath:instancePath+"/feature_refs/" + i1,schemaPath:"#/properties/feature_refs/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
}
else {
const err21 = {instancePath:instancePath+"/feature_refs",schemaPath:"#/properties/feature_refs/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.evidence_ref !== undefined){
if(typeof data.evidence_ref !== "string"){
const err22 = {instancePath:instancePath+"/evidence_ref",schemaPath:"#/properties/evidence_ref/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.reasoning_summary !== undefined){
if(typeof data.reasoning_summary !== "string"){
const err23 = {instancePath:instancePath+"/reasoning_summary",schemaPath:"#/properties/reasoning_summary/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
}
else {
const err24 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
validate32.errors = vErrors;
return errors === 0;
}
validate32.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate31(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://interface-sandbox.local/schemas/operatorChallenge.schema.json" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate31.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.operator_challenge_gate === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "operator_challenge_gate"},message:"must have required property '"+"operator_challenge_gate"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.corrected_ledger_entries === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "corrected_ledger_entries"},message:"must have required property '"+"corrected_ledger_entries"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "operator_challenge_gate") || (key0 === "corrected_ledger_entries"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.operator_challenge_gate !== undefined){
let data0 = data.operator_challenge_gate;
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
if(data0.completed === undefined){
const err3 = {instancePath:instancePath+"/operator_challenge_gate",schemaPath:"#/properties/operator_challenge_gate/required",keyword:"required",params:{missingProperty: "completed"},message:"must have required property '"+"completed"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data0.result === undefined){
const err4 = {instancePath:instancePath+"/operator_challenge_gate",schemaPath:"#/properties/operator_challenge_gate/required",keyword:"required",params:{missingProperty: "result"},message:"must have required property '"+"result"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data0.registry_count_loaded === undefined){
const err5 = {instancePath:instancePath+"/operator_challenge_gate",schemaPath:"#/properties/operator_challenge_gate/required",keyword:"required",params:{missingProperty: "registry_count_loaded"},message:"must have required property '"+"registry_count_loaded"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data0.registry_count_evaluated === undefined){
const err6 = {instancePath:instancePath+"/operator_challenge_gate",schemaPath:"#/properties/operator_challenge_gate/required",keyword:"required",params:{missingProperty: "registry_count_evaluated"},message:"must have required property '"+"registry_count_evaluated"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data0.reopened_rows === undefined){
const err7 = {instancePath:instancePath+"/operator_challenge_gate",schemaPath:"#/properties/operator_challenge_gate/required",keyword:"required",params:{missingProperty: "reopened_rows"},message:"must have required property '"+"reopened_rows"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data0.high_risk_checks === undefined){
const err8 = {instancePath:instancePath+"/operator_challenge_gate",schemaPath:"#/properties/operator_challenge_gate/required",keyword:"required",params:{missingProperty: "high_risk_checks"},message:"must have required property '"+"high_risk_checks"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data0.notes === undefined){
const err9 = {instancePath:instancePath+"/operator_challenge_gate",schemaPath:"#/properties/operator_challenge_gate/required",keyword:"required",params:{missingProperty: "notes"},message:"must have required property '"+"notes"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key1 in data0){
if(!(((((((key1 === "completed") || (key1 === "result")) || (key1 === "registry_count_loaded")) || (key1 === "registry_count_evaluated")) || (key1 === "reopened_rows")) || (key1 === "high_risk_checks")) || (key1 === "notes"))){
const err10 = {instancePath:instancePath+"/operator_challenge_gate",schemaPath:"#/properties/operator_challenge_gate/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data0.completed !== undefined){
if(typeof data0.completed !== "boolean"){
const err11 = {instancePath:instancePath+"/operator_challenge_gate/completed",schemaPath:"#/properties/operator_challenge_gate/properties/completed/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data0.result !== undefined){
let data2 = data0.result;
if(typeof data2 !== "string"){
const err12 = {instancePath:instancePath+"/operator_challenge_gate/result",schemaPath:"#/properties/operator_challenge_gate/properties/result/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(!((((data2 === "PASS") || (data2 === "PASS_WITH_WARNINGS")) || (data2 === "REOPENED")) || (data2 === "FAIL_RETRY_REQUIRED"))){
const err13 = {instancePath:instancePath+"/operator_challenge_gate/result",schemaPath:"#/properties/operator_challenge_gate/properties/result/enum",keyword:"enum",params:{allowedValues: schema47.properties.operator_challenge_gate.properties.result.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data0.registry_count_loaded !== undefined){
let data3 = data0.registry_count_loaded;
if(!((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3)))){
const err14 = {instancePath:instancePath+"/operator_challenge_gate/registry_count_loaded",schemaPath:"#/properties/operator_challenge_gate/properties/registry_count_loaded/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(typeof data3 == "number"){
if(data3 < 0 || isNaN(data3)){
const err15 = {instancePath:instancePath+"/operator_challenge_gate/registry_count_loaded",schemaPath:"#/properties/operator_challenge_gate/properties/registry_count_loaded/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
}
if(data0.registry_count_evaluated !== undefined){
let data4 = data0.registry_count_evaluated;
if(!((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4)))){
const err16 = {instancePath:instancePath+"/operator_challenge_gate/registry_count_evaluated",schemaPath:"#/properties/operator_challenge_gate/properties/registry_count_evaluated/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(typeof data4 == "number"){
if(data4 < 0 || isNaN(data4)){
const err17 = {instancePath:instancePath+"/operator_challenge_gate/registry_count_evaluated",schemaPath:"#/properties/operator_challenge_gate/properties/registry_count_evaluated/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
}
if(data0.reopened_rows !== undefined){
let data5 = data0.reopened_rows;
if(Array.isArray(data5)){
const len0 = data5.length;
for(let i0=0; i0<len0; i0++){
let data6 = data5[i0];
if(data6 && typeof data6 == "object" && !Array.isArray(data6)){
if(data6.threat_id === undefined){
const err18 = {instancePath:instancePath+"/operator_challenge_gate/reopened_rows/" + i0,schemaPath:"#/properties/operator_challenge_gate/properties/reopened_rows/items/required",keyword:"required",params:{missingProperty: "threat_id"},message:"must have required property '"+"threat_id"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data6.previous_status === undefined){
const err19 = {instancePath:instancePath+"/operator_challenge_gate/reopened_rows/" + i0,schemaPath:"#/properties/operator_challenge_gate/properties/reopened_rows/items/required",keyword:"required",params:{missingProperty: "previous_status"},message:"must have required property '"+"previous_status"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data6.reopened_status === undefined){
const err20 = {instancePath:instancePath+"/operator_challenge_gate/reopened_rows/" + i0,schemaPath:"#/properties/operator_challenge_gate/properties/reopened_rows/items/required",keyword:"required",params:{missingProperty: "reopened_status"},message:"must have required property '"+"reopened_status"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data6.reason === undefined){
const err21 = {instancePath:instancePath+"/operator_challenge_gate/reopened_rows/" + i0,schemaPath:"#/properties/operator_challenge_gate/properties/reopened_rows/items/required",keyword:"required",params:{missingProperty: "reason"},message:"must have required property '"+"reason"+"'"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data6.required_action === undefined){
const err22 = {instancePath:instancePath+"/operator_challenge_gate/reopened_rows/" + i0,schemaPath:"#/properties/operator_challenge_gate/properties/reopened_rows/items/required",keyword:"required",params:{missingProperty: "required_action"},message:"must have required property '"+"required_action"+"'"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
for(const key2 in data6){
if(!(((((key2 === "threat_id") || (key2 === "previous_status")) || (key2 === "reopened_status")) || (key2 === "reason")) || (key2 === "required_action"))){
const err23 = {instancePath:instancePath+"/operator_challenge_gate/reopened_rows/" + i0,schemaPath:"#/properties/operator_challenge_gate/properties/reopened_rows/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data6.threat_id !== undefined){
if(typeof data6.threat_id !== "string"){
const err24 = {instancePath:instancePath+"/operator_challenge_gate/reopened_rows/" + i0+"/threat_id",schemaPath:"#/properties/operator_challenge_gate/properties/reopened_rows/items/properties/threat_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data6.previous_status !== undefined){
let data8 = data6.previous_status;
if(typeof data8 !== "string"){
const err25 = {instancePath:instancePath+"/operator_challenge_gate/reopened_rows/" + i0+"/previous_status",schemaPath:"#/$defs/finalStatus/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(!(((((data8 === "TRIGGERED") || (data8 === "CONTROLLED")) || (data8 === "NOT_TRIGGERED")) || (data8 === "NOT_APPLICABLE")) || (data8 === "INSUFFICIENT_EVIDENCE"))){
const err26 = {instancePath:instancePath+"/operator_challenge_gate/reopened_rows/" + i0+"/previous_status",schemaPath:"#/$defs/finalStatus/enum",keyword:"enum",params:{allowedValues: schema48.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data6.reopened_status !== undefined){
let data9 = data6.reopened_status;
if(typeof data9 !== "string"){
const err27 = {instancePath:instancePath+"/operator_challenge_gate/reopened_rows/" + i0+"/reopened_status",schemaPath:"#/$defs/finalStatus/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(!(((((data9 === "TRIGGERED") || (data9 === "CONTROLLED")) || (data9 === "NOT_TRIGGERED")) || (data9 === "NOT_APPLICABLE")) || (data9 === "INSUFFICIENT_EVIDENCE"))){
const err28 = {instancePath:instancePath+"/operator_challenge_gate/reopened_rows/" + i0+"/reopened_status",schemaPath:"#/$defs/finalStatus/enum",keyword:"enum",params:{allowedValues: schema48.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data6.reason !== undefined){
if(typeof data6.reason !== "string"){
const err29 = {instancePath:instancePath+"/operator_challenge_gate/reopened_rows/" + i0+"/reason",schemaPath:"#/properties/operator_challenge_gate/properties/reopened_rows/items/properties/reason/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data6.required_action !== undefined){
if(typeof data6.required_action !== "string"){
const err30 = {instancePath:instancePath+"/operator_challenge_gate/reopened_rows/" + i0+"/required_action",schemaPath:"#/properties/operator_challenge_gate/properties/reopened_rows/items/properties/required_action/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
}
else {
const err31 = {instancePath:instancePath+"/operator_challenge_gate/reopened_rows/" + i0,schemaPath:"#/properties/operator_challenge_gate/properties/reopened_rows/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
}
else {
const err32 = {instancePath:instancePath+"/operator_challenge_gate/reopened_rows",schemaPath:"#/properties/operator_challenge_gate/properties/reopened_rows/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data0.high_risk_checks !== undefined){
let data12 = data0.high_risk_checks;
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
}
else {
const err33 = {instancePath:instancePath+"/operator_challenge_gate/high_risk_checks",schemaPath:"#/properties/operator_challenge_gate/properties/high_risk_checks/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data0.notes !== undefined){
let data13 = data0.notes;
if(Array.isArray(data13)){
const len1 = data13.length;
for(let i1=0; i1<len1; i1++){
if(typeof data13[i1] !== "string"){
const err34 = {instancePath:instancePath+"/operator_challenge_gate/notes/" + i1,schemaPath:"#/properties/operator_challenge_gate/properties/notes/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
}
else {
const err35 = {instancePath:instancePath+"/operator_challenge_gate/notes",schemaPath:"#/properties/operator_challenge_gate/properties/notes/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
}
else {
const err36 = {instancePath:instancePath+"/operator_challenge_gate",schemaPath:"#/properties/operator_challenge_gate/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data.corrected_ledger_entries !== undefined){
let data15 = data.corrected_ledger_entries;
if(Array.isArray(data15)){
const len2 = data15.length;
for(let i2=0; i2<len2; i2++){
if(!(validate32(data15[i2], {instancePath:instancePath+"/corrected_ledger_entries/" + i2,parentData:data15,parentDataProperty:i2,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate32.errors : vErrors.concat(validate32.errors);
errors = vErrors.length;
}
}
}
else {
const err37 = {instancePath:instancePath+"/corrected_ledger_entries",schemaPath:"#/properties/corrected_ledger_entries/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
}
else {
const err38 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
validate31.errors = vErrors;
return errors === 0;
}
validate31.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

export const validate_compilerOutput = validate34;
const schema52 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://interface-sandbox.local/schemas/compilerOutput.schema.json","title":"Diligence Compiler Output","description":"Stage 06 / Node 5 compiler-only output. This schema intentionally excludes Node 5B deterministic backend fields: vault_prefill_suggestions, assembly_handoff, and handoff_envelope. Multiple manual URLs are represented in upstream target_input.manual_urls while source_mode remains url unless pasted text is also supplied.","type":"object","required":["diligence_run","source_bundle_summary","target_profile","primary_product","product_feature_map","legal_stack","document_stack_redline","threat_registry_summary","feature_to_threat_matrix","findings","controlled_rows","insufficient_evidence_rows","assembly_route","report_data","technical_audit_log","threat_findings","vault_confirmation_questions","disclaimer"],"additionalProperties":false,"properties":{"diligence_run":{"type":"object","required":["run_id","source_mode","compiler_status"],"additionalProperties":true,"properties":{"run_id":{"type":"string"},"submitted_at":{"type":"string"},"created_at":{"type":"string"},"source_mode":{"type":"string","enum":["url","text","url_plus_text"]},"compiler_status":{"type":"string"}}},"source_bundle_summary":{"type":"object","additionalProperties":true},"target_profile":{"type":"object","additionalProperties":true},"primary_product":{"type":"object","additionalProperties":true},"product_feature_map":{"type":"array","items":{"type":"object","additionalProperties":true}},"legal_stack":{"type":"array","items":{"type":"object","additionalProperties":true}},"document_stack_redline":{"type":"array","items":{"type":"object","additionalProperties":true}},"threat_registry_summary":{"type":"object","required":["registry_count_loaded","registry_count_evaluated","status_counts"],"additionalProperties":true,"properties":{"registry_count_loaded":{"type":"integer","minimum":0},"registry_count_evaluated":{"type":"integer","minimum":0},"status_counts":{"type":"object","required":["TRIGGERED","CONTROLLED","NOT_TRIGGERED","NOT_APPLICABLE","INSUFFICIENT_EVIDENCE"],"additionalProperties":false,"properties":{"TRIGGERED":{"type":"integer","minimum":0},"CONTROLLED":{"type":"integer","minimum":0},"NOT_TRIGGERED":{"type":"integer","minimum":0},"NOT_APPLICABLE":{"type":"integer","minimum":0},"INSUFFICIENT_EVIDENCE":{"type":"integer","minimum":0}}},"counts_by_pain_tier":{"type":"object","additionalProperties":{"type":"integer","minimum":0}},"counts_by_pain_category":{"type":"object","additionalProperties":{"type":"integer","minimum":0}},"counts_by_archetype":{"type":"object","additionalProperties":{"type":"integer","minimum":0}},"counts_by_surface":{"type":"object","additionalProperties":{"type":"integer","minimum":0}},"counts_by_lane":{"type":"object","additionalProperties":{"type":"integer","minimum":0}},"operator_challenge_result":{"type":"string"},"reopened_count":{"type":"integer","minimum":0},"warnings":{"type":"array","items":{"type":"string"}}}},"feature_to_threat_matrix":{"type":"array","items":{"$ref":"#/$defs/featureThreatMatrixItem"}},"findings":{"type":"array","description":"Must equal count(final_status == TRIGGERED) in the post-challenge ledger.","items":{"$ref":"#/$defs/finding"}},"controlled_rows":{"type":"array","description":"Must equal count(final_status == CONTROLLED) in the post-challenge ledger.","items":{"$ref":"#/$defs/controlledRow"}},"insufficient_evidence_rows":{"type":"array","description":"Must equal count(final_status == INSUFFICIENT_EVIDENCE) in the post-challenge ledger.","items":{"$ref":"#/$defs/insufficientEvidenceRow"}},"assembly_route":{"type":"object","required":["recommended_package","document_routes","route_reasoning","local_counsel_review_required","vault_confirmation_question_count","backend_assembler_note"],"additionalProperties":true,"properties":{"recommended_package":{"type":"string"},"document_routes":{"type":"array","items":{"type":"string"}},"route_reasoning":{"type":"string"},"local_counsel_review_required":{"type":"boolean"},"vault_confirmation_question_count":{"type":"integer","minimum":0},"backend_assembler_note":{"type":"string"}}},"report_data":{"type":"object","required":["executive_report","full_forensic_record"],"additionalProperties":false,"properties":{"executive_report":{"type":"object","required":["cover_and_reliance","scope_and_methodology","subject_profile","risk_posture_summary","material_highlights","triggered_findings_schedule","document_stack_verdict","recommended_route"],"additionalProperties":false,"properties":{"cover_and_reliance":{"type":"object","additionalProperties":true},"scope_and_methodology":{"type":"object","additionalProperties":true},"subject_profile":{"type":"object","additionalProperties":true},"risk_posture_summary":{"type":"object","additionalProperties":true},"material_highlights":{"type":"array","items":{"type":"object","additionalProperties":true}},"triggered_findings_schedule":{"type":"array","items":{"type":"object","required":["threat_id","threat_name","pain_category","archetype","linked_feature","document_route","short_issue"],"additionalProperties":false,"properties":{"threat_id":{"type":"string"},"threat_name":{"type":"string"},"pain_category":{"type":"string"},"archetype":{"type":"string"},"linked_feature":{"type":"string"},"document_route":{"type":"string"},"short_issue":{"type":"string"}}}},"document_stack_verdict":{"type":"object","additionalProperties":true},"recommended_route":{"type":"object","additionalProperties":true}}},"full_forensic_record":{"type":"object","required":["source_review","artifact_inventory","product_feature_map","feature_to_threat_matrix","document_stack_redline","triggered_findings","controlled_rows","insufficient_evidence_rows","assembly_route","technical_audit_log"],"additionalProperties":false,"properties":{"source_review":{"type":"object","additionalProperties":true},"artifact_inventory":{"type":"array","items":{"type":"object","additionalProperties":true}},"product_feature_map":{"type":"array","items":{"type":"object","additionalProperties":true}},"feature_to_threat_matrix":{"type":"array","items":{"$ref":"#/$defs/featureThreatMatrixItem"}},"document_stack_redline":{"type":"array","items":{"type":"object","additionalProperties":true}},"triggered_findings":{"type":"array","items":{"$ref":"#/$defs/finding"}},"controlled_rows":{"type":"array","items":{"$ref":"#/$defs/controlledRow"}},"insufficient_evidence_rows":{"type":"array","items":{"$ref":"#/$defs/insufficientEvidenceRow"}},"assembly_route":{"type":"object","additionalProperties":true},"technical_audit_log":{"type":"array","items":{"$ref":"#/$defs/auditEntry"}}}}}},"technical_audit_log":{"type":"array","items":{"$ref":"#/$defs/auditEntry"}},"threat_findings":{"type":"array","items":{"$ref":"#/$defs/threatFinding"}},"vault_confirmation_questions":{"type":"array","items":{"$ref":"#/$defs/vaultConfirmationQuestion"}},"disclaimer":{"type":"string","const":"Public demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use."}},"$defs":{"finding":{"type":"object","required":["finding_id","threat_id","threat_name","status","pain_tier","pain_category","pain_depth","lane","archetype","surface_tokens","subcat","authority","linked_feature_ids","evidence","trigger_evaluation","registry_payload","redline_route","document_routes","vault_dependencies","finding_memo_note"],"additionalProperties":false,"properties":{"finding_id":{"type":"string"},"threat_id":{"type":"string"},"threat_name":{"type":"string"},"status":{"const":"TRIGGERED"},"pain_tier":{"type":"string"},"pain_category":{"type":"string"},"pain_depth":{"type":"string"},"lane":{"type":"string"},"archetype":{"type":"string"},"surface_tokens":{"type":"array","items":{"type":"string"}},"subcat":{"type":"string"},"authority":{"type":"object","required":["IN","EU","US"],"additionalProperties":false,"properties":{"IN":{"type":"string"},"EU":{"type":"string"},"US":{"type":"string"}}},"linked_feature_ids":{"type":"array","items":{"type":"string"}},"evidence":{"type":"object","required":["source_url","artifact_class","proof_citation","evidence_mode","source_hash","extracted_excerpt"],"additionalProperties":false,"properties":{"source_url":{"type":"string"},"artifact_class":{"type":"string"},"proof_citation":{"type":"string"},"evidence_mode":{"type":"string","enum":["QUOTE","ABSENCE","INFERENCE_FROM_ADMITTED_EVIDENCE","LIMITATION","OTHER"]},"source_hash":{"type":"string"},"extracted_excerpt":{"type":"string"}}},"trigger_evaluation":{"type":"object","required":["conditions_passed","conditions_failed","trigger_if_result","exclude_if_result","exclude_if_basis"],"additionalProperties":false,"properties":{"conditions_passed":{"type":"array","items":{"type":"string"}},"conditions_failed":{"type":"array","items":{"type":"string"}},"trigger_if_result":{"type":"boolean"},"exclude_if_result":{"type":"boolean"},"exclude_if_basis":{"type":"string"}}},"registry_payload":{"type":"object","required":["legal_pain","fp_mechanism","fp_impact","lex_nova_fix"],"additionalProperties":false,"properties":{"legal_pain":{"type":"string"},"fp_mechanism":{"type":"string"},"fp_impact":{"type":"string"},"lex_nova_fix":{"type":"string"}}},"redline_route":{"type":"array","items":{"type":"string"}},"document_routes":{"type":"array","items":{"type":"string"}},"vault_dependencies":{"type":"array","items":{"$ref":"#/$defs/vaultFieldPath"}},"finding_memo_note":{"type":"string"}}},"controlledRow":{"type":"object","required":["threat_id","threat_name","status","linked_feature_ids","control_basis","evidence_ref","reasoning_summary","document_routes","technical_note"],"additionalProperties":true,"properties":{"threat_id":{"type":"string"},"threat_name":{"type":"string"},"status":{"const":"CONTROLLED"},"linked_feature_ids":{"type":"array","items":{"type":"string"}},"control_basis":{"type":"string"},"evidence_ref":{"type":"string"},"reasoning_summary":{"type":"string"},"document_routes":{"type":"array","items":{"type":"string"}},"technical_note":{"type":"string"}}},"insufficientEvidenceRow":{"type":"object","required":["threat_id","threat_name","status","linked_feature_ids","missing_evidence","evidence_ref","reasoning_summary","recommended_follow_up","technical_note"],"additionalProperties":true,"properties":{"threat_id":{"type":"string"},"threat_name":{"type":"string"},"status":{"const":"INSUFFICIENT_EVIDENCE"},"linked_feature_ids":{"type":"array","items":{"type":"string"}},"missing_evidence":{"type":"string"},"evidence_ref":{"type":"string"},"reasoning_summary":{"type":"string"},"recommended_follow_up":{"type":"string"},"technical_note":{"type":"string"}}},"featureThreatMatrixItem":{"type":"object","required":["feature_ref","feature_name","archetype_codes","surface_tokens","triggered_threat_ids","controlled_threat_ids","insufficient_evidence_threat_ids","not_triggered_threat_ids","not_applicable_threat_ids","document_routes","summary"],"additionalProperties":true,"properties":{"feature_ref":{"type":"string"},"feature_name":{"type":"string"},"archetype_codes":{"type":"array","items":{"type":"string"}},"surface_tokens":{"type":"array","items":{"type":"string"}},"triggered_threat_ids":{"type":"array","items":{"type":"string"}},"controlled_threat_ids":{"type":"array","items":{"type":"string"}},"insufficient_evidence_threat_ids":{"type":"array","items":{"type":"string"}},"not_triggered_threat_ids":{"type":"array","items":{"type":"string"}},"not_applicable_threat_ids":{"type":"array","items":{"type":"string"}},"document_routes":{"type":"array","items":{"type":"string"}},"summary":{"type":"string"}}},"auditEntry":{"type":"object","required":["entry_type","message","severity"],"additionalProperties":true,"properties":{"entry_type":{"type":"string"},"threat_id":{"type":"string"},"status":{"type":"string"},"message":{"type":"string"},"source_ref":{"type":"string"},"severity":{"type":"string","enum":["INFO","WARNING","ERROR"]}}},"threatFinding":{"type":"object","required":["finding_id","threat_id","threat_name","linked_feature_ids","document_routes","vault_dependencies","severity","status"],"additionalProperties":true,"properties":{"finding_id":{"type":"string"},"threat_id":{"type":"string"},"threat_name":{"type":"string"},"linked_feature_ids":{"type":"array","items":{"type":"string"}},"document_routes":{"type":"array","items":{"type":"string"}},"vault_dependencies":{"type":"array","items":{"$ref":"#/$defs/vaultFieldPath"}},"severity":{"type":"string"},"status":{"const":"TRIGGERED"}}},"vaultConfirmationQuestion":{"type":"object","required":["field_path","question","why_it_matters","source_finding_ids","priority"],"additionalProperties":false,"properties":{"field_path":{"$ref":"#/$defs/vaultFieldPath"},"question":{"type":"string"},"why_it_matters":{"type":"string"},"source_finding_ids":{"type":"array","items":{"type":"string"}},"priority":{"type":"string","enum":["HIGH","MEDIUM","LOW"]}}},"vaultFieldPath":{"type":"string","enum":["baseline.company","baseline.entity_type","baseline.address","baseline.legal_email","baseline.privacy_email","baseline.products","baseline.jurisdiction.country","baseline.jurisdiction.state","baseline.market","baseline.delivery.app","baseline.delivery.api","baseline.revenue_model","baseline.acv","baseline.has_beta","baseline.output_ownership","baseline.sla_type","baseline.integrations.slack","baseline.integrations.crm","baseline.integrations.stripe","baseline.integrations.github","baseline.integrations.webhooks","baseline.integrations.none","baseline.reliance_threshold","architecture.memory","architecture.models","architecture.sub_processors.openai","architecture.sub_processors.anthropic","architecture.sub_processors.google","architecture.sub_processors.cohere","architecture.sub_processors.mistral","architecture.sub_processors.other","architecture.sub_processors.url","architecture.cloud_host","architecture.vector_db","archetypes.is_doer","archetypes.is_orchestrator","archetypes.agent_limits.session_cap","archetypes.agent_limits.period_cap","archetypes.agent_limits.retry_limit","archetypes.agent_limits.loop_threshold","archetypes.is_creator","archetypes.is_reader","archetypes.conversational_ui","archetypes.sens_bio","archetypes.is_judge","archetypes.is_judge_hr","archetypes.is_judge_legal","archetypes.is_optimizer","archetypes.sens_fin","archetypes.is_shield","archetypes.is_mover","archetypes.is_generalist","compliance.processes_pii","compliance.eu_users","compliance.ca_users","compliance.other_regions","compliance.sens_health","compliance.sens_fin","compliance.sens_employment","compliance.minors","compliance.distress","compliance.standard_adults"]}}};
const schema53 = {"type":"object","required":["feature_ref","feature_name","archetype_codes","surface_tokens","triggered_threat_ids","controlled_threat_ids","insufficient_evidence_threat_ids","not_triggered_threat_ids","not_applicable_threat_ids","document_routes","summary"],"additionalProperties":true,"properties":{"feature_ref":{"type":"string"},"feature_name":{"type":"string"},"archetype_codes":{"type":"array","items":{"type":"string"}},"surface_tokens":{"type":"array","items":{"type":"string"}},"triggered_threat_ids":{"type":"array","items":{"type":"string"}},"controlled_threat_ids":{"type":"array","items":{"type":"string"}},"insufficient_evidence_threat_ids":{"type":"array","items":{"type":"string"}},"not_triggered_threat_ids":{"type":"array","items":{"type":"string"}},"not_applicable_threat_ids":{"type":"array","items":{"type":"string"}},"document_routes":{"type":"array","items":{"type":"string"}},"summary":{"type":"string"}}};
const schema56 = {"type":"object","required":["threat_id","threat_name","status","linked_feature_ids","control_basis","evidence_ref","reasoning_summary","document_routes","technical_note"],"additionalProperties":true,"properties":{"threat_id":{"type":"string"},"threat_name":{"type":"string"},"status":{"const":"CONTROLLED"},"linked_feature_ids":{"type":"array","items":{"type":"string"}},"control_basis":{"type":"string"},"evidence_ref":{"type":"string"},"reasoning_summary":{"type":"string"},"document_routes":{"type":"array","items":{"type":"string"}},"technical_note":{"type":"string"}}};
const schema57 = {"type":"object","required":["threat_id","threat_name","status","linked_feature_ids","missing_evidence","evidence_ref","reasoning_summary","recommended_follow_up","technical_note"],"additionalProperties":true,"properties":{"threat_id":{"type":"string"},"threat_name":{"type":"string"},"status":{"const":"INSUFFICIENT_EVIDENCE"},"linked_feature_ids":{"type":"array","items":{"type":"string"}},"missing_evidence":{"type":"string"},"evidence_ref":{"type":"string"},"reasoning_summary":{"type":"string"},"recommended_follow_up":{"type":"string"},"technical_note":{"type":"string"}}};
const schema61 = {"type":"object","required":["entry_type","message","severity"],"additionalProperties":true,"properties":{"entry_type":{"type":"string"},"threat_id":{"type":"string"},"status":{"type":"string"},"message":{"type":"string"},"source_ref":{"type":"string"},"severity":{"type":"string","enum":["INFO","WARNING","ERROR"]}}};
const schema54 = {"type":"object","required":["finding_id","threat_id","threat_name","status","pain_tier","pain_category","pain_depth","lane","archetype","surface_tokens","subcat","authority","linked_feature_ids","evidence","trigger_evaluation","registry_payload","redline_route","document_routes","vault_dependencies","finding_memo_note"],"additionalProperties":false,"properties":{"finding_id":{"type":"string"},"threat_id":{"type":"string"},"threat_name":{"type":"string"},"status":{"const":"TRIGGERED"},"pain_tier":{"type":"string"},"pain_category":{"type":"string"},"pain_depth":{"type":"string"},"lane":{"type":"string"},"archetype":{"type":"string"},"surface_tokens":{"type":"array","items":{"type":"string"}},"subcat":{"type":"string"},"authority":{"type":"object","required":["IN","EU","US"],"additionalProperties":false,"properties":{"IN":{"type":"string"},"EU":{"type":"string"},"US":{"type":"string"}}},"linked_feature_ids":{"type":"array","items":{"type":"string"}},"evidence":{"type":"object","required":["source_url","artifact_class","proof_citation","evidence_mode","source_hash","extracted_excerpt"],"additionalProperties":false,"properties":{"source_url":{"type":"string"},"artifact_class":{"type":"string"},"proof_citation":{"type":"string"},"evidence_mode":{"type":"string","enum":["QUOTE","ABSENCE","INFERENCE_FROM_ADMITTED_EVIDENCE","LIMITATION","OTHER"]},"source_hash":{"type":"string"},"extracted_excerpt":{"type":"string"}}},"trigger_evaluation":{"type":"object","required":["conditions_passed","conditions_failed","trigger_if_result","exclude_if_result","exclude_if_basis"],"additionalProperties":false,"properties":{"conditions_passed":{"type":"array","items":{"type":"string"}},"conditions_failed":{"type":"array","items":{"type":"string"}},"trigger_if_result":{"type":"boolean"},"exclude_if_result":{"type":"boolean"},"exclude_if_basis":{"type":"string"}}},"registry_payload":{"type":"object","required":["legal_pain","fp_mechanism","fp_impact","lex_nova_fix"],"additionalProperties":false,"properties":{"legal_pain":{"type":"string"},"fp_mechanism":{"type":"string"},"fp_impact":{"type":"string"},"lex_nova_fix":{"type":"string"}}},"redline_route":{"type":"array","items":{"type":"string"}},"document_routes":{"type":"array","items":{"type":"string"}},"vault_dependencies":{"type":"array","items":{"$ref":"#/$defs/vaultFieldPath"}},"finding_memo_note":{"type":"string"}}};
const schema55 = {"type":"string","enum":["baseline.company","baseline.entity_type","baseline.address","baseline.legal_email","baseline.privacy_email","baseline.products","baseline.jurisdiction.country","baseline.jurisdiction.state","baseline.market","baseline.delivery.app","baseline.delivery.api","baseline.revenue_model","baseline.acv","baseline.has_beta","baseline.output_ownership","baseline.sla_type","baseline.integrations.slack","baseline.integrations.crm","baseline.integrations.stripe","baseline.integrations.github","baseline.integrations.webhooks","baseline.integrations.none","baseline.reliance_threshold","architecture.memory","architecture.models","architecture.sub_processors.openai","architecture.sub_processors.anthropic","architecture.sub_processors.google","architecture.sub_processors.cohere","architecture.sub_processors.mistral","architecture.sub_processors.other","architecture.sub_processors.url","architecture.cloud_host","architecture.vector_db","archetypes.is_doer","archetypes.is_orchestrator","archetypes.agent_limits.session_cap","archetypes.agent_limits.period_cap","archetypes.agent_limits.retry_limit","archetypes.agent_limits.loop_threshold","archetypes.is_creator","archetypes.is_reader","archetypes.conversational_ui","archetypes.sens_bio","archetypes.is_judge","archetypes.is_judge_hr","archetypes.is_judge_legal","archetypes.is_optimizer","archetypes.sens_fin","archetypes.is_shield","archetypes.is_mover","archetypes.is_generalist","compliance.processes_pii","compliance.eu_users","compliance.ca_users","compliance.other_regions","compliance.sens_health","compliance.sens_fin","compliance.sens_employment","compliance.minors","compliance.distress","compliance.standard_adults"]};

function validate35(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate35.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.finding_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "finding_id"},message:"must have required property '"+"finding_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.threat_id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "threat_id"},message:"must have required property '"+"threat_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.threat_name === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "threat_name"},message:"must have required property '"+"threat_name"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.status === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.pain_tier === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "pain_tier"},message:"must have required property '"+"pain_tier"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.pain_category === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "pain_category"},message:"must have required property '"+"pain_category"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.pain_depth === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "pain_depth"},message:"must have required property '"+"pain_depth"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.lane === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "lane"},message:"must have required property '"+"lane"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.archetype === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "archetype"},message:"must have required property '"+"archetype"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.surface_tokens === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "surface_tokens"},message:"must have required property '"+"surface_tokens"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.subcat === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "subcat"},message:"must have required property '"+"subcat"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.authority === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "authority"},message:"must have required property '"+"authority"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.linked_feature_ids === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "linked_feature_ids"},message:"must have required property '"+"linked_feature_ids"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.evidence === undefined){
const err13 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence"},message:"must have required property '"+"evidence"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data.trigger_evaluation === undefined){
const err14 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "trigger_evaluation"},message:"must have required property '"+"trigger_evaluation"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data.registry_payload === undefined){
const err15 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "registry_payload"},message:"must have required property '"+"registry_payload"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data.redline_route === undefined){
const err16 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "redline_route"},message:"must have required property '"+"redline_route"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data.document_routes === undefined){
const err17 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "document_routes"},message:"must have required property '"+"document_routes"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data.vault_dependencies === undefined){
const err18 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "vault_dependencies"},message:"must have required property '"+"vault_dependencies"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data.finding_memo_note === undefined){
const err19 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "finding_memo_note"},message:"must have required property '"+"finding_memo_note"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema54.properties, key0))){
const err20 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.finding_id !== undefined){
if(typeof data.finding_id !== "string"){
const err21 = {instancePath:instancePath+"/finding_id",schemaPath:"#/properties/finding_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.threat_id !== undefined){
if(typeof data.threat_id !== "string"){
const err22 = {instancePath:instancePath+"/threat_id",schemaPath:"#/properties/threat_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.threat_name !== undefined){
if(typeof data.threat_name !== "string"){
const err23 = {instancePath:instancePath+"/threat_name",schemaPath:"#/properties/threat_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.status !== undefined){
if("TRIGGERED" !== data.status){
const err24 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/const",keyword:"const",params:{allowedValue: "TRIGGERED"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.pain_tier !== undefined){
if(typeof data.pain_tier !== "string"){
const err25 = {instancePath:instancePath+"/pain_tier",schemaPath:"#/properties/pain_tier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.pain_category !== undefined){
if(typeof data.pain_category !== "string"){
const err26 = {instancePath:instancePath+"/pain_category",schemaPath:"#/properties/pain_category/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data.pain_depth !== undefined){
if(typeof data.pain_depth !== "string"){
const err27 = {instancePath:instancePath+"/pain_depth",schemaPath:"#/properties/pain_depth/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.lane !== undefined){
if(typeof data.lane !== "string"){
const err28 = {instancePath:instancePath+"/lane",schemaPath:"#/properties/lane/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data.archetype !== undefined){
if(typeof data.archetype !== "string"){
const err29 = {instancePath:instancePath+"/archetype",schemaPath:"#/properties/archetype/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data.surface_tokens !== undefined){
let data9 = data.surface_tokens;
if(Array.isArray(data9)){
const len0 = data9.length;
for(let i0=0; i0<len0; i0++){
if(typeof data9[i0] !== "string"){
const err30 = {instancePath:instancePath+"/surface_tokens/" + i0,schemaPath:"#/properties/surface_tokens/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
}
else {
const err31 = {instancePath:instancePath+"/surface_tokens",schemaPath:"#/properties/surface_tokens/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data.subcat !== undefined){
if(typeof data.subcat !== "string"){
const err32 = {instancePath:instancePath+"/subcat",schemaPath:"#/properties/subcat/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data.authority !== undefined){
let data12 = data.authority;
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
if(data12.IN === undefined){
const err33 = {instancePath:instancePath+"/authority",schemaPath:"#/properties/authority/required",keyword:"required",params:{missingProperty: "IN"},message:"must have required property '"+"IN"+"'"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(data12.EU === undefined){
const err34 = {instancePath:instancePath+"/authority",schemaPath:"#/properties/authority/required",keyword:"required",params:{missingProperty: "EU"},message:"must have required property '"+"EU"+"'"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(data12.US === undefined){
const err35 = {instancePath:instancePath+"/authority",schemaPath:"#/properties/authority/required",keyword:"required",params:{missingProperty: "US"},message:"must have required property '"+"US"+"'"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
for(const key1 in data12){
if(!(((key1 === "IN") || (key1 === "EU")) || (key1 === "US"))){
const err36 = {instancePath:instancePath+"/authority",schemaPath:"#/properties/authority/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data12.IN !== undefined){
if(typeof data12.IN !== "string"){
const err37 = {instancePath:instancePath+"/authority/IN",schemaPath:"#/properties/authority/properties/IN/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data12.EU !== undefined){
if(typeof data12.EU !== "string"){
const err38 = {instancePath:instancePath+"/authority/EU",schemaPath:"#/properties/authority/properties/EU/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(data12.US !== undefined){
if(typeof data12.US !== "string"){
const err39 = {instancePath:instancePath+"/authority/US",schemaPath:"#/properties/authority/properties/US/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
}
else {
const err40 = {instancePath:instancePath+"/authority",schemaPath:"#/properties/authority/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(data.linked_feature_ids !== undefined){
let data16 = data.linked_feature_ids;
if(Array.isArray(data16)){
const len1 = data16.length;
for(let i1=0; i1<len1; i1++){
if(typeof data16[i1] !== "string"){
const err41 = {instancePath:instancePath+"/linked_feature_ids/" + i1,schemaPath:"#/properties/linked_feature_ids/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
}
else {
const err42 = {instancePath:instancePath+"/linked_feature_ids",schemaPath:"#/properties/linked_feature_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data.evidence !== undefined){
let data18 = data.evidence;
if(data18 && typeof data18 == "object" && !Array.isArray(data18)){
if(data18.source_url === undefined){
const err43 = {instancePath:instancePath+"/evidence",schemaPath:"#/properties/evidence/required",keyword:"required",params:{missingProperty: "source_url"},message:"must have required property '"+"source_url"+"'"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(data18.artifact_class === undefined){
const err44 = {instancePath:instancePath+"/evidence",schemaPath:"#/properties/evidence/required",keyword:"required",params:{missingProperty: "artifact_class"},message:"must have required property '"+"artifact_class"+"'"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(data18.proof_citation === undefined){
const err45 = {instancePath:instancePath+"/evidence",schemaPath:"#/properties/evidence/required",keyword:"required",params:{missingProperty: "proof_citation"},message:"must have required property '"+"proof_citation"+"'"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(data18.evidence_mode === undefined){
const err46 = {instancePath:instancePath+"/evidence",schemaPath:"#/properties/evidence/required",keyword:"required",params:{missingProperty: "evidence_mode"},message:"must have required property '"+"evidence_mode"+"'"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
if(data18.source_hash === undefined){
const err47 = {instancePath:instancePath+"/evidence",schemaPath:"#/properties/evidence/required",keyword:"required",params:{missingProperty: "source_hash"},message:"must have required property '"+"source_hash"+"'"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(data18.extracted_excerpt === undefined){
const err48 = {instancePath:instancePath+"/evidence",schemaPath:"#/properties/evidence/required",keyword:"required",params:{missingProperty: "extracted_excerpt"},message:"must have required property '"+"extracted_excerpt"+"'"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
for(const key2 in data18){
if(!((((((key2 === "source_url") || (key2 === "artifact_class")) || (key2 === "proof_citation")) || (key2 === "evidence_mode")) || (key2 === "source_hash")) || (key2 === "extracted_excerpt"))){
const err49 = {instancePath:instancePath+"/evidence",schemaPath:"#/properties/evidence/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
if(data18.source_url !== undefined){
if(typeof data18.source_url !== "string"){
const err50 = {instancePath:instancePath+"/evidence/source_url",schemaPath:"#/properties/evidence/properties/source_url/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
if(data18.artifact_class !== undefined){
if(typeof data18.artifact_class !== "string"){
const err51 = {instancePath:instancePath+"/evidence/artifact_class",schemaPath:"#/properties/evidence/properties/artifact_class/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
if(data18.proof_citation !== undefined){
if(typeof data18.proof_citation !== "string"){
const err52 = {instancePath:instancePath+"/evidence/proof_citation",schemaPath:"#/properties/evidence/properties/proof_citation/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
if(data18.evidence_mode !== undefined){
let data22 = data18.evidence_mode;
if(typeof data22 !== "string"){
const err53 = {instancePath:instancePath+"/evidence/evidence_mode",schemaPath:"#/properties/evidence/properties/evidence_mode/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(!(((((data22 === "QUOTE") || (data22 === "ABSENCE")) || (data22 === "INFERENCE_FROM_ADMITTED_EVIDENCE")) || (data22 === "LIMITATION")) || (data22 === "OTHER"))){
const err54 = {instancePath:instancePath+"/evidence/evidence_mode",schemaPath:"#/properties/evidence/properties/evidence_mode/enum",keyword:"enum",params:{allowedValues: schema54.properties.evidence.properties.evidence_mode.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
if(data18.source_hash !== undefined){
if(typeof data18.source_hash !== "string"){
const err55 = {instancePath:instancePath+"/evidence/source_hash",schemaPath:"#/properties/evidence/properties/source_hash/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
if(data18.extracted_excerpt !== undefined){
if(typeof data18.extracted_excerpt !== "string"){
const err56 = {instancePath:instancePath+"/evidence/extracted_excerpt",schemaPath:"#/properties/evidence/properties/extracted_excerpt/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
}
else {
const err57 = {instancePath:instancePath+"/evidence",schemaPath:"#/properties/evidence/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
}
if(data.trigger_evaluation !== undefined){
let data25 = data.trigger_evaluation;
if(data25 && typeof data25 == "object" && !Array.isArray(data25)){
if(data25.conditions_passed === undefined){
const err58 = {instancePath:instancePath+"/trigger_evaluation",schemaPath:"#/properties/trigger_evaluation/required",keyword:"required",params:{missingProperty: "conditions_passed"},message:"must have required property '"+"conditions_passed"+"'"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
if(data25.conditions_failed === undefined){
const err59 = {instancePath:instancePath+"/trigger_evaluation",schemaPath:"#/properties/trigger_evaluation/required",keyword:"required",params:{missingProperty: "conditions_failed"},message:"must have required property '"+"conditions_failed"+"'"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(data25.trigger_if_result === undefined){
const err60 = {instancePath:instancePath+"/trigger_evaluation",schemaPath:"#/properties/trigger_evaluation/required",keyword:"required",params:{missingProperty: "trigger_if_result"},message:"must have required property '"+"trigger_if_result"+"'"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
if(data25.exclude_if_result === undefined){
const err61 = {instancePath:instancePath+"/trigger_evaluation",schemaPath:"#/properties/trigger_evaluation/required",keyword:"required",params:{missingProperty: "exclude_if_result"},message:"must have required property '"+"exclude_if_result"+"'"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if(data25.exclude_if_basis === undefined){
const err62 = {instancePath:instancePath+"/trigger_evaluation",schemaPath:"#/properties/trigger_evaluation/required",keyword:"required",params:{missingProperty: "exclude_if_basis"},message:"must have required property '"+"exclude_if_basis"+"'"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
for(const key3 in data25){
if(!(((((key3 === "conditions_passed") || (key3 === "conditions_failed")) || (key3 === "trigger_if_result")) || (key3 === "exclude_if_result")) || (key3 === "exclude_if_basis"))){
const err63 = {instancePath:instancePath+"/trigger_evaluation",schemaPath:"#/properties/trigger_evaluation/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
if(data25.conditions_passed !== undefined){
let data26 = data25.conditions_passed;
if(Array.isArray(data26)){
const len2 = data26.length;
for(let i2=0; i2<len2; i2++){
if(typeof data26[i2] !== "string"){
const err64 = {instancePath:instancePath+"/trigger_evaluation/conditions_passed/" + i2,schemaPath:"#/properties/trigger_evaluation/properties/conditions_passed/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
}
}
else {
const err65 = {instancePath:instancePath+"/trigger_evaluation/conditions_passed",schemaPath:"#/properties/trigger_evaluation/properties/conditions_passed/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
}
if(data25.conditions_failed !== undefined){
let data28 = data25.conditions_failed;
if(Array.isArray(data28)){
const len3 = data28.length;
for(let i3=0; i3<len3; i3++){
if(typeof data28[i3] !== "string"){
const err66 = {instancePath:instancePath+"/trigger_evaluation/conditions_failed/" + i3,schemaPath:"#/properties/trigger_evaluation/properties/conditions_failed/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
}
else {
const err67 = {instancePath:instancePath+"/trigger_evaluation/conditions_failed",schemaPath:"#/properties/trigger_evaluation/properties/conditions_failed/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
}
if(data25.trigger_if_result !== undefined){
if(typeof data25.trigger_if_result !== "boolean"){
const err68 = {instancePath:instancePath+"/trigger_evaluation/trigger_if_result",schemaPath:"#/properties/trigger_evaluation/properties/trigger_if_result/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
}
if(data25.exclude_if_result !== undefined){
if(typeof data25.exclude_if_result !== "boolean"){
const err69 = {instancePath:instancePath+"/trigger_evaluation/exclude_if_result",schemaPath:"#/properties/trigger_evaluation/properties/exclude_if_result/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
}
if(data25.exclude_if_basis !== undefined){
if(typeof data25.exclude_if_basis !== "string"){
const err70 = {instancePath:instancePath+"/trigger_evaluation/exclude_if_basis",schemaPath:"#/properties/trigger_evaluation/properties/exclude_if_basis/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
}
}
else {
const err71 = {instancePath:instancePath+"/trigger_evaluation",schemaPath:"#/properties/trigger_evaluation/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
}
if(data.registry_payload !== undefined){
let data33 = data.registry_payload;
if(data33 && typeof data33 == "object" && !Array.isArray(data33)){
if(data33.legal_pain === undefined){
const err72 = {instancePath:instancePath+"/registry_payload",schemaPath:"#/properties/registry_payload/required",keyword:"required",params:{missingProperty: "legal_pain"},message:"must have required property '"+"legal_pain"+"'"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
if(data33.fp_mechanism === undefined){
const err73 = {instancePath:instancePath+"/registry_payload",schemaPath:"#/properties/registry_payload/required",keyword:"required",params:{missingProperty: "fp_mechanism"},message:"must have required property '"+"fp_mechanism"+"'"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
if(data33.fp_impact === undefined){
const err74 = {instancePath:instancePath+"/registry_payload",schemaPath:"#/properties/registry_payload/required",keyword:"required",params:{missingProperty: "fp_impact"},message:"must have required property '"+"fp_impact"+"'"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
if(data33.lex_nova_fix === undefined){
const err75 = {instancePath:instancePath+"/registry_payload",schemaPath:"#/properties/registry_payload/required",keyword:"required",params:{missingProperty: "lex_nova_fix"},message:"must have required property '"+"lex_nova_fix"+"'"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
for(const key4 in data33){
if(!((((key4 === "legal_pain") || (key4 === "fp_mechanism")) || (key4 === "fp_impact")) || (key4 === "lex_nova_fix"))){
const err76 = {instancePath:instancePath+"/registry_payload",schemaPath:"#/properties/registry_payload/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
}
if(data33.legal_pain !== undefined){
if(typeof data33.legal_pain !== "string"){
const err77 = {instancePath:instancePath+"/registry_payload/legal_pain",schemaPath:"#/properties/registry_payload/properties/legal_pain/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
}
if(data33.fp_mechanism !== undefined){
if(typeof data33.fp_mechanism !== "string"){
const err78 = {instancePath:instancePath+"/registry_payload/fp_mechanism",schemaPath:"#/properties/registry_payload/properties/fp_mechanism/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
if(data33.fp_impact !== undefined){
if(typeof data33.fp_impact !== "string"){
const err79 = {instancePath:instancePath+"/registry_payload/fp_impact",schemaPath:"#/properties/registry_payload/properties/fp_impact/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
}
if(data33.lex_nova_fix !== undefined){
if(typeof data33.lex_nova_fix !== "string"){
const err80 = {instancePath:instancePath+"/registry_payload/lex_nova_fix",schemaPath:"#/properties/registry_payload/properties/lex_nova_fix/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
}
}
else {
const err81 = {instancePath:instancePath+"/registry_payload",schemaPath:"#/properties/registry_payload/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
}
if(data.redline_route !== undefined){
let data38 = data.redline_route;
if(Array.isArray(data38)){
const len4 = data38.length;
for(let i4=0; i4<len4; i4++){
if(typeof data38[i4] !== "string"){
const err82 = {instancePath:instancePath+"/redline_route/" + i4,schemaPath:"#/properties/redline_route/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
}
}
else {
const err83 = {instancePath:instancePath+"/redline_route",schemaPath:"#/properties/redline_route/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
}
if(data.document_routes !== undefined){
let data40 = data.document_routes;
if(Array.isArray(data40)){
const len5 = data40.length;
for(let i5=0; i5<len5; i5++){
if(typeof data40[i5] !== "string"){
const err84 = {instancePath:instancePath+"/document_routes/" + i5,schemaPath:"#/properties/document_routes/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
}
}
else {
const err85 = {instancePath:instancePath+"/document_routes",schemaPath:"#/properties/document_routes/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
}
if(data.vault_dependencies !== undefined){
let data42 = data.vault_dependencies;
if(Array.isArray(data42)){
const len6 = data42.length;
for(let i6=0; i6<len6; i6++){
let data43 = data42[i6];
if(typeof data43 !== "string"){
const err86 = {instancePath:instancePath+"/vault_dependencies/" + i6,schemaPath:"#/$defs/vaultFieldPath/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
if(!((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((data43 === "baseline.company") || (data43 === "baseline.entity_type")) || (data43 === "baseline.address")) || (data43 === "baseline.legal_email")) || (data43 === "baseline.privacy_email")) || (data43 === "baseline.products")) || (data43 === "baseline.jurisdiction.country")) || (data43 === "baseline.jurisdiction.state")) || (data43 === "baseline.market")) || (data43 === "baseline.delivery.app")) || (data43 === "baseline.delivery.api")) || (data43 === "baseline.revenue_model")) || (data43 === "baseline.acv")) || (data43 === "baseline.has_beta")) || (data43 === "baseline.output_ownership")) || (data43 === "baseline.sla_type")) || (data43 === "baseline.integrations.slack")) || (data43 === "baseline.integrations.crm")) || (data43 === "baseline.integrations.stripe")) || (data43 === "baseline.integrations.github")) || (data43 === "baseline.integrations.webhooks")) || (data43 === "baseline.integrations.none")) || (data43 === "baseline.reliance_threshold")) || (data43 === "architecture.memory")) || (data43 === "architecture.models")) || (data43 === "architecture.sub_processors.openai")) || (data43 === "architecture.sub_processors.anthropic")) || (data43 === "architecture.sub_processors.google")) || (data43 === "architecture.sub_processors.cohere")) || (data43 === "architecture.sub_processors.mistral")) || (data43 === "architecture.sub_processors.other")) || (data43 === "architecture.sub_processors.url")) || (data43 === "architecture.cloud_host")) || (data43 === "architecture.vector_db")) || (data43 === "archetypes.is_doer")) || (data43 === "archetypes.is_orchestrator")) || (data43 === "archetypes.agent_limits.session_cap")) || (data43 === "archetypes.agent_limits.period_cap")) || (data43 === "archetypes.agent_limits.retry_limit")) || (data43 === "archetypes.agent_limits.loop_threshold")) || (data43 === "archetypes.is_creator")) || (data43 === "archetypes.is_reader")) || (data43 === "archetypes.conversational_ui")) || (data43 === "archetypes.sens_bio")) || (data43 === "archetypes.is_judge")) || (data43 === "archetypes.is_judge_hr")) || (data43 === "archetypes.is_judge_legal")) || (data43 === "archetypes.is_optimizer")) || (data43 === "archetypes.sens_fin")) || (data43 === "archetypes.is_shield")) || (data43 === "archetypes.is_mover")) || (data43 === "archetypes.is_generalist")) || (data43 === "compliance.processes_pii")) || (data43 === "compliance.eu_users")) || (data43 === "compliance.ca_users")) || (data43 === "compliance.other_regions")) || (data43 === "compliance.sens_health")) || (data43 === "compliance.sens_fin")) || (data43 === "compliance.sens_employment")) || (data43 === "compliance.minors")) || (data43 === "compliance.distress")) || (data43 === "compliance.standard_adults"))){
const err87 = {instancePath:instancePath+"/vault_dependencies/" + i6,schemaPath:"#/$defs/vaultFieldPath/enum",keyword:"enum",params:{allowedValues: schema55.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
}
}
else {
const err88 = {instancePath:instancePath+"/vault_dependencies",schemaPath:"#/properties/vault_dependencies/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
}
if(data.finding_memo_note !== undefined){
if(typeof data.finding_memo_note !== "string"){
const err89 = {instancePath:instancePath+"/finding_memo_note",schemaPath:"#/properties/finding_memo_note/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
}
}
else {
const err90 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
validate35.errors = vErrors;
return errors === 0;
}
validate35.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema63 = {"type":"object","required":["finding_id","threat_id","threat_name","linked_feature_ids","document_routes","vault_dependencies","severity","status"],"additionalProperties":true,"properties":{"finding_id":{"type":"string"},"threat_id":{"type":"string"},"threat_name":{"type":"string"},"linked_feature_ids":{"type":"array","items":{"type":"string"}},"document_routes":{"type":"array","items":{"type":"string"}},"vault_dependencies":{"type":"array","items":{"$ref":"#/$defs/vaultFieldPath"}},"severity":{"type":"string"},"status":{"const":"TRIGGERED"}}};

function validate38(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate38.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.finding_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "finding_id"},message:"must have required property '"+"finding_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.threat_id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "threat_id"},message:"must have required property '"+"threat_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.threat_name === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "threat_name"},message:"must have required property '"+"threat_name"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.linked_feature_ids === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "linked_feature_ids"},message:"must have required property '"+"linked_feature_ids"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.document_routes === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "document_routes"},message:"must have required property '"+"document_routes"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.vault_dependencies === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "vault_dependencies"},message:"must have required property '"+"vault_dependencies"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.severity === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "severity"},message:"must have required property '"+"severity"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.status === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.finding_id !== undefined){
if(typeof data.finding_id !== "string"){
const err8 = {instancePath:instancePath+"/finding_id",schemaPath:"#/properties/finding_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.threat_id !== undefined){
if(typeof data.threat_id !== "string"){
const err9 = {instancePath:instancePath+"/threat_id",schemaPath:"#/properties/threat_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.threat_name !== undefined){
if(typeof data.threat_name !== "string"){
const err10 = {instancePath:instancePath+"/threat_name",schemaPath:"#/properties/threat_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.linked_feature_ids !== undefined){
let data3 = data.linked_feature_ids;
if(Array.isArray(data3)){
const len0 = data3.length;
for(let i0=0; i0<len0; i0++){
if(typeof data3[i0] !== "string"){
const err11 = {instancePath:instancePath+"/linked_feature_ids/" + i0,schemaPath:"#/properties/linked_feature_ids/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
}
else {
const err12 = {instancePath:instancePath+"/linked_feature_ids",schemaPath:"#/properties/linked_feature_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.document_routes !== undefined){
let data5 = data.document_routes;
if(Array.isArray(data5)){
const len1 = data5.length;
for(let i1=0; i1<len1; i1++){
if(typeof data5[i1] !== "string"){
const err13 = {instancePath:instancePath+"/document_routes/" + i1,schemaPath:"#/properties/document_routes/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
}
else {
const err14 = {instancePath:instancePath+"/document_routes",schemaPath:"#/properties/document_routes/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.vault_dependencies !== undefined){
let data7 = data.vault_dependencies;
if(Array.isArray(data7)){
const len2 = data7.length;
for(let i2=0; i2<len2; i2++){
let data8 = data7[i2];
if(typeof data8 !== "string"){
const err15 = {instancePath:instancePath+"/vault_dependencies/" + i2,schemaPath:"#/$defs/vaultFieldPath/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(!((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((data8 === "baseline.company") || (data8 === "baseline.entity_type")) || (data8 === "baseline.address")) || (data8 === "baseline.legal_email")) || (data8 === "baseline.privacy_email")) || (data8 === "baseline.products")) || (data8 === "baseline.jurisdiction.country")) || (data8 === "baseline.jurisdiction.state")) || (data8 === "baseline.market")) || (data8 === "baseline.delivery.app")) || (data8 === "baseline.delivery.api")) || (data8 === "baseline.revenue_model")) || (data8 === "baseline.acv")) || (data8 === "baseline.has_beta")) || (data8 === "baseline.output_ownership")) || (data8 === "baseline.sla_type")) || (data8 === "baseline.integrations.slack")) || (data8 === "baseline.integrations.crm")) || (data8 === "baseline.integrations.stripe")) || (data8 === "baseline.integrations.github")) || (data8 === "baseline.integrations.webhooks")) || (data8 === "baseline.integrations.none")) || (data8 === "baseline.reliance_threshold")) || (data8 === "architecture.memory")) || (data8 === "architecture.models")) || (data8 === "architecture.sub_processors.openai")) || (data8 === "architecture.sub_processors.anthropic")) || (data8 === "architecture.sub_processors.google")) || (data8 === "architecture.sub_processors.cohere")) || (data8 === "architecture.sub_processors.mistral")) || (data8 === "architecture.sub_processors.other")) || (data8 === "architecture.sub_processors.url")) || (data8 === "architecture.cloud_host")) || (data8 === "architecture.vector_db")) || (data8 === "archetypes.is_doer")) || (data8 === "archetypes.is_orchestrator")) || (data8 === "archetypes.agent_limits.session_cap")) || (data8 === "archetypes.agent_limits.period_cap")) || (data8 === "archetypes.agent_limits.retry_limit")) || (data8 === "archetypes.agent_limits.loop_threshold")) || (data8 === "archetypes.is_creator")) || (data8 === "archetypes.is_reader")) || (data8 === "archetypes.conversational_ui")) || (data8 === "archetypes.sens_bio")) || (data8 === "archetypes.is_judge")) || (data8 === "archetypes.is_judge_hr")) || (data8 === "archetypes.is_judge_legal")) || (data8 === "archetypes.is_optimizer")) || (data8 === "archetypes.sens_fin")) || (data8 === "archetypes.is_shield")) || (data8 === "archetypes.is_mover")) || (data8 === "archetypes.is_generalist")) || (data8 === "compliance.processes_pii")) || (data8 === "compliance.eu_users")) || (data8 === "compliance.ca_users")) || (data8 === "compliance.other_regions")) || (data8 === "compliance.sens_health")) || (data8 === "compliance.sens_fin")) || (data8 === "compliance.sens_employment")) || (data8 === "compliance.minors")) || (data8 === "compliance.distress")) || (data8 === "compliance.standard_adults"))){
const err16 = {instancePath:instancePath+"/vault_dependencies/" + i2,schemaPath:"#/$defs/vaultFieldPath/enum",keyword:"enum",params:{allowedValues: schema55.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
}
else {
const err17 = {instancePath:instancePath+"/vault_dependencies",schemaPath:"#/properties/vault_dependencies/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.severity !== undefined){
if(typeof data.severity !== "string"){
const err18 = {instancePath:instancePath+"/severity",schemaPath:"#/properties/severity/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.status !== undefined){
if("TRIGGERED" !== data.status){
const err19 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/const",keyword:"const",params:{allowedValue: "TRIGGERED"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
}
else {
const err20 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
validate38.errors = vErrors;
return errors === 0;
}
validate38.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema65 = {"type":"object","required":["field_path","question","why_it_matters","source_finding_ids","priority"],"additionalProperties":false,"properties":{"field_path":{"$ref":"#/$defs/vaultFieldPath"},"question":{"type":"string"},"why_it_matters":{"type":"string"},"source_finding_ids":{"type":"array","items":{"type":"string"}},"priority":{"type":"string","enum":["HIGH","MEDIUM","LOW"]}}};

function validate40(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate40.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.field_path === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "field_path"},message:"must have required property '"+"field_path"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.question === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "question"},message:"must have required property '"+"question"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.why_it_matters === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "why_it_matters"},message:"must have required property '"+"why_it_matters"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.source_finding_ids === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_finding_ids"},message:"must have required property '"+"source_finding_ids"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.priority === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "priority"},message:"must have required property '"+"priority"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "field_path") || (key0 === "question")) || (key0 === "why_it_matters")) || (key0 === "source_finding_ids")) || (key0 === "priority"))){
const err5 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.field_path !== undefined){
let data0 = data.field_path;
if(typeof data0 !== "string"){
const err6 = {instancePath:instancePath+"/field_path",schemaPath:"#/$defs/vaultFieldPath/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((data0 === "baseline.company") || (data0 === "baseline.entity_type")) || (data0 === "baseline.address")) || (data0 === "baseline.legal_email")) || (data0 === "baseline.privacy_email")) || (data0 === "baseline.products")) || (data0 === "baseline.jurisdiction.country")) || (data0 === "baseline.jurisdiction.state")) || (data0 === "baseline.market")) || (data0 === "baseline.delivery.app")) || (data0 === "baseline.delivery.api")) || (data0 === "baseline.revenue_model")) || (data0 === "baseline.acv")) || (data0 === "baseline.has_beta")) || (data0 === "baseline.output_ownership")) || (data0 === "baseline.sla_type")) || (data0 === "baseline.integrations.slack")) || (data0 === "baseline.integrations.crm")) || (data0 === "baseline.integrations.stripe")) || (data0 === "baseline.integrations.github")) || (data0 === "baseline.integrations.webhooks")) || (data0 === "baseline.integrations.none")) || (data0 === "baseline.reliance_threshold")) || (data0 === "architecture.memory")) || (data0 === "architecture.models")) || (data0 === "architecture.sub_processors.openai")) || (data0 === "architecture.sub_processors.anthropic")) || (data0 === "architecture.sub_processors.google")) || (data0 === "architecture.sub_processors.cohere")) || (data0 === "architecture.sub_processors.mistral")) || (data0 === "architecture.sub_processors.other")) || (data0 === "architecture.sub_processors.url")) || (data0 === "architecture.cloud_host")) || (data0 === "architecture.vector_db")) || (data0 === "archetypes.is_doer")) || (data0 === "archetypes.is_orchestrator")) || (data0 === "archetypes.agent_limits.session_cap")) || (data0 === "archetypes.agent_limits.period_cap")) || (data0 === "archetypes.agent_limits.retry_limit")) || (data0 === "archetypes.agent_limits.loop_threshold")) || (data0 === "archetypes.is_creator")) || (data0 === "archetypes.is_reader")) || (data0 === "archetypes.conversational_ui")) || (data0 === "archetypes.sens_bio")) || (data0 === "archetypes.is_judge")) || (data0 === "archetypes.is_judge_hr")) || (data0 === "archetypes.is_judge_legal")) || (data0 === "archetypes.is_optimizer")) || (data0 === "archetypes.sens_fin")) || (data0 === "archetypes.is_shield")) || (data0 === "archetypes.is_mover")) || (data0 === "archetypes.is_generalist")) || (data0 === "compliance.processes_pii")) || (data0 === "compliance.eu_users")) || (data0 === "compliance.ca_users")) || (data0 === "compliance.other_regions")) || (data0 === "compliance.sens_health")) || (data0 === "compliance.sens_fin")) || (data0 === "compliance.sens_employment")) || (data0 === "compliance.minors")) || (data0 === "compliance.distress")) || (data0 === "compliance.standard_adults"))){
const err7 = {instancePath:instancePath+"/field_path",schemaPath:"#/$defs/vaultFieldPath/enum",keyword:"enum",params:{allowedValues: schema55.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.question !== undefined){
if(typeof data.question !== "string"){
const err8 = {instancePath:instancePath+"/question",schemaPath:"#/properties/question/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.why_it_matters !== undefined){
if(typeof data.why_it_matters !== "string"){
const err9 = {instancePath:instancePath+"/why_it_matters",schemaPath:"#/properties/why_it_matters/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.source_finding_ids !== undefined){
let data3 = data.source_finding_ids;
if(Array.isArray(data3)){
const len0 = data3.length;
for(let i0=0; i0<len0; i0++){
if(typeof data3[i0] !== "string"){
const err10 = {instancePath:instancePath+"/source_finding_ids/" + i0,schemaPath:"#/properties/source_finding_ids/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
}
else {
const err11 = {instancePath:instancePath+"/source_finding_ids",schemaPath:"#/properties/source_finding_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.priority !== undefined){
let data5 = data.priority;
if(typeof data5 !== "string"){
const err12 = {instancePath:instancePath+"/priority",schemaPath:"#/properties/priority/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(!(((data5 === "HIGH") || (data5 === "MEDIUM")) || (data5 === "LOW"))){
const err13 = {instancePath:instancePath+"/priority",schemaPath:"#/properties/priority/enum",keyword:"enum",params:{allowedValues: schema65.properties.priority.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
}
else {
const err14 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
validate40.errors = vErrors;
return errors === 0;
}
validate40.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate34(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://interface-sandbox.local/schemas/compilerOutput.schema.json" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate34.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.diligence_run === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "diligence_run"},message:"must have required property '"+"diligence_run"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.source_bundle_summary === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_bundle_summary"},message:"must have required property '"+"source_bundle_summary"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.target_profile === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "target_profile"},message:"must have required property '"+"target_profile"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.primary_product === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "primary_product"},message:"must have required property '"+"primary_product"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.product_feature_map === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "product_feature_map"},message:"must have required property '"+"product_feature_map"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.legal_stack === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "legal_stack"},message:"must have required property '"+"legal_stack"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.document_stack_redline === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "document_stack_redline"},message:"must have required property '"+"document_stack_redline"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.threat_registry_summary === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "threat_registry_summary"},message:"must have required property '"+"threat_registry_summary"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.feature_to_threat_matrix === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "feature_to_threat_matrix"},message:"must have required property '"+"feature_to_threat_matrix"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.findings === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "findings"},message:"must have required property '"+"findings"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.controlled_rows === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "controlled_rows"},message:"must have required property '"+"controlled_rows"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.insufficient_evidence_rows === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "insufficient_evidence_rows"},message:"must have required property '"+"insufficient_evidence_rows"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.assembly_route === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "assembly_route"},message:"must have required property '"+"assembly_route"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.report_data === undefined){
const err13 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "report_data"},message:"must have required property '"+"report_data"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data.technical_audit_log === undefined){
const err14 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "technical_audit_log"},message:"must have required property '"+"technical_audit_log"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data.threat_findings === undefined){
const err15 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "threat_findings"},message:"must have required property '"+"threat_findings"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data.vault_confirmation_questions === undefined){
const err16 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "vault_confirmation_questions"},message:"must have required property '"+"vault_confirmation_questions"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data.disclaimer === undefined){
const err17 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "disclaimer"},message:"must have required property '"+"disclaimer"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema52.properties, key0))){
const err18 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.diligence_run !== undefined){
let data0 = data.diligence_run;
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
if(data0.run_id === undefined){
const err19 = {instancePath:instancePath+"/diligence_run",schemaPath:"#/properties/diligence_run/required",keyword:"required",params:{missingProperty: "run_id"},message:"must have required property '"+"run_id"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data0.source_mode === undefined){
const err20 = {instancePath:instancePath+"/diligence_run",schemaPath:"#/properties/diligence_run/required",keyword:"required",params:{missingProperty: "source_mode"},message:"must have required property '"+"source_mode"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data0.compiler_status === undefined){
const err21 = {instancePath:instancePath+"/diligence_run",schemaPath:"#/properties/diligence_run/required",keyword:"required",params:{missingProperty: "compiler_status"},message:"must have required property '"+"compiler_status"+"'"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data0.run_id !== undefined){
if(typeof data0.run_id !== "string"){
const err22 = {instancePath:instancePath+"/diligence_run/run_id",schemaPath:"#/properties/diligence_run/properties/run_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data0.submitted_at !== undefined){
if(typeof data0.submitted_at !== "string"){
const err23 = {instancePath:instancePath+"/diligence_run/submitted_at",schemaPath:"#/properties/diligence_run/properties/submitted_at/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data0.created_at !== undefined){
if(typeof data0.created_at !== "string"){
const err24 = {instancePath:instancePath+"/diligence_run/created_at",schemaPath:"#/properties/diligence_run/properties/created_at/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data0.source_mode !== undefined){
let data4 = data0.source_mode;
if(typeof data4 !== "string"){
const err25 = {instancePath:instancePath+"/diligence_run/source_mode",schemaPath:"#/properties/diligence_run/properties/source_mode/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(!(((data4 === "url") || (data4 === "text")) || (data4 === "url_plus_text"))){
const err26 = {instancePath:instancePath+"/diligence_run/source_mode",schemaPath:"#/properties/diligence_run/properties/source_mode/enum",keyword:"enum",params:{allowedValues: schema52.properties.diligence_run.properties.source_mode.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data0.compiler_status !== undefined){
if(typeof data0.compiler_status !== "string"){
const err27 = {instancePath:instancePath+"/diligence_run/compiler_status",schemaPath:"#/properties/diligence_run/properties/compiler_status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
}
else {
const err28 = {instancePath:instancePath+"/diligence_run",schemaPath:"#/properties/diligence_run/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data.source_bundle_summary !== undefined){
let data6 = data.source_bundle_summary;
if(data6 && typeof data6 == "object" && !Array.isArray(data6)){
}
else {
const err29 = {instancePath:instancePath+"/source_bundle_summary",schemaPath:"#/properties/source_bundle_summary/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data.target_profile !== undefined){
let data7 = data.target_profile;
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
}
else {
const err30 = {instancePath:instancePath+"/target_profile",schemaPath:"#/properties/target_profile/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data.primary_product !== undefined){
let data8 = data.primary_product;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
}
else {
const err31 = {instancePath:instancePath+"/primary_product",schemaPath:"#/properties/primary_product/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data.product_feature_map !== undefined){
let data9 = data.product_feature_map;
if(Array.isArray(data9)){
const len0 = data9.length;
for(let i0=0; i0<len0; i0++){
let data10 = data9[i0];
if(data10 && typeof data10 == "object" && !Array.isArray(data10)){
}
else {
const err32 = {instancePath:instancePath+"/product_feature_map/" + i0,schemaPath:"#/properties/product_feature_map/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
}
else {
const err33 = {instancePath:instancePath+"/product_feature_map",schemaPath:"#/properties/product_feature_map/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data.legal_stack !== undefined){
let data11 = data.legal_stack;
if(Array.isArray(data11)){
const len1 = data11.length;
for(let i1=0; i1<len1; i1++){
let data12 = data11[i1];
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
}
else {
const err34 = {instancePath:instancePath+"/legal_stack/" + i1,schemaPath:"#/properties/legal_stack/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
}
else {
const err35 = {instancePath:instancePath+"/legal_stack",schemaPath:"#/properties/legal_stack/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data.document_stack_redline !== undefined){
let data13 = data.document_stack_redline;
if(Array.isArray(data13)){
const len2 = data13.length;
for(let i2=0; i2<len2; i2++){
let data14 = data13[i2];
if(data14 && typeof data14 == "object" && !Array.isArray(data14)){
}
else {
const err36 = {instancePath:instancePath+"/document_stack_redline/" + i2,schemaPath:"#/properties/document_stack_redline/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
}
else {
const err37 = {instancePath:instancePath+"/document_stack_redline",schemaPath:"#/properties/document_stack_redline/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data.threat_registry_summary !== undefined){
let data15 = data.threat_registry_summary;
if(data15 && typeof data15 == "object" && !Array.isArray(data15)){
if(data15.registry_count_loaded === undefined){
const err38 = {instancePath:instancePath+"/threat_registry_summary",schemaPath:"#/properties/threat_registry_summary/required",keyword:"required",params:{missingProperty: "registry_count_loaded"},message:"must have required property '"+"registry_count_loaded"+"'"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(data15.registry_count_evaluated === undefined){
const err39 = {instancePath:instancePath+"/threat_registry_summary",schemaPath:"#/properties/threat_registry_summary/required",keyword:"required",params:{missingProperty: "registry_count_evaluated"},message:"must have required property '"+"registry_count_evaluated"+"'"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data15.status_counts === undefined){
const err40 = {instancePath:instancePath+"/threat_registry_summary",schemaPath:"#/properties/threat_registry_summary/required",keyword:"required",params:{missingProperty: "status_counts"},message:"must have required property '"+"status_counts"+"'"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(data15.registry_count_loaded !== undefined){
let data16 = data15.registry_count_loaded;
if(!((typeof data16 == "number") && (!(data16 % 1) && !isNaN(data16)))){
const err41 = {instancePath:instancePath+"/threat_registry_summary/registry_count_loaded",schemaPath:"#/properties/threat_registry_summary/properties/registry_count_loaded/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(typeof data16 == "number"){
if(data16 < 0 || isNaN(data16)){
const err42 = {instancePath:instancePath+"/threat_registry_summary/registry_count_loaded",schemaPath:"#/properties/threat_registry_summary/properties/registry_count_loaded/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
}
if(data15.registry_count_evaluated !== undefined){
let data17 = data15.registry_count_evaluated;
if(!((typeof data17 == "number") && (!(data17 % 1) && !isNaN(data17)))){
const err43 = {instancePath:instancePath+"/threat_registry_summary/registry_count_evaluated",schemaPath:"#/properties/threat_registry_summary/properties/registry_count_evaluated/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(typeof data17 == "number"){
if(data17 < 0 || isNaN(data17)){
const err44 = {instancePath:instancePath+"/threat_registry_summary/registry_count_evaluated",schemaPath:"#/properties/threat_registry_summary/properties/registry_count_evaluated/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
}
if(data15.status_counts !== undefined){
let data18 = data15.status_counts;
if(data18 && typeof data18 == "object" && !Array.isArray(data18)){
if(data18.TRIGGERED === undefined){
const err45 = {instancePath:instancePath+"/threat_registry_summary/status_counts",schemaPath:"#/properties/threat_registry_summary/properties/status_counts/required",keyword:"required",params:{missingProperty: "TRIGGERED"},message:"must have required property '"+"TRIGGERED"+"'"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(data18.CONTROLLED === undefined){
const err46 = {instancePath:instancePath+"/threat_registry_summary/status_counts",schemaPath:"#/properties/threat_registry_summary/properties/status_counts/required",keyword:"required",params:{missingProperty: "CONTROLLED"},message:"must have required property '"+"CONTROLLED"+"'"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
if(data18.NOT_TRIGGERED === undefined){
const err47 = {instancePath:instancePath+"/threat_registry_summary/status_counts",schemaPath:"#/properties/threat_registry_summary/properties/status_counts/required",keyword:"required",params:{missingProperty: "NOT_TRIGGERED"},message:"must have required property '"+"NOT_TRIGGERED"+"'"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(data18.NOT_APPLICABLE === undefined){
const err48 = {instancePath:instancePath+"/threat_registry_summary/status_counts",schemaPath:"#/properties/threat_registry_summary/properties/status_counts/required",keyword:"required",params:{missingProperty: "NOT_APPLICABLE"},message:"must have required property '"+"NOT_APPLICABLE"+"'"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(data18.INSUFFICIENT_EVIDENCE === undefined){
const err49 = {instancePath:instancePath+"/threat_registry_summary/status_counts",schemaPath:"#/properties/threat_registry_summary/properties/status_counts/required",keyword:"required",params:{missingProperty: "INSUFFICIENT_EVIDENCE"},message:"must have required property '"+"INSUFFICIENT_EVIDENCE"+"'"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
for(const key1 in data18){
if(!(((((key1 === "TRIGGERED") || (key1 === "CONTROLLED")) || (key1 === "NOT_TRIGGERED")) || (key1 === "NOT_APPLICABLE")) || (key1 === "INSUFFICIENT_EVIDENCE"))){
const err50 = {instancePath:instancePath+"/threat_registry_summary/status_counts",schemaPath:"#/properties/threat_registry_summary/properties/status_counts/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
if(data18.TRIGGERED !== undefined){
let data19 = data18.TRIGGERED;
if(!((typeof data19 == "number") && (!(data19 % 1) && !isNaN(data19)))){
const err51 = {instancePath:instancePath+"/threat_registry_summary/status_counts/TRIGGERED",schemaPath:"#/properties/threat_registry_summary/properties/status_counts/properties/TRIGGERED/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if(typeof data19 == "number"){
if(data19 < 0 || isNaN(data19)){
const err52 = {instancePath:instancePath+"/threat_registry_summary/status_counts/TRIGGERED",schemaPath:"#/properties/threat_registry_summary/properties/status_counts/properties/TRIGGERED/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
}
if(data18.CONTROLLED !== undefined){
let data20 = data18.CONTROLLED;
if(!((typeof data20 == "number") && (!(data20 % 1) && !isNaN(data20)))){
const err53 = {instancePath:instancePath+"/threat_registry_summary/status_counts/CONTROLLED",schemaPath:"#/properties/threat_registry_summary/properties/status_counts/properties/CONTROLLED/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(typeof data20 == "number"){
if(data20 < 0 || isNaN(data20)){
const err54 = {instancePath:instancePath+"/threat_registry_summary/status_counts/CONTROLLED",schemaPath:"#/properties/threat_registry_summary/properties/status_counts/properties/CONTROLLED/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
}
if(data18.NOT_TRIGGERED !== undefined){
let data21 = data18.NOT_TRIGGERED;
if(!((typeof data21 == "number") && (!(data21 % 1) && !isNaN(data21)))){
const err55 = {instancePath:instancePath+"/threat_registry_summary/status_counts/NOT_TRIGGERED",schemaPath:"#/properties/threat_registry_summary/properties/status_counts/properties/NOT_TRIGGERED/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
if(typeof data21 == "number"){
if(data21 < 0 || isNaN(data21)){
const err56 = {instancePath:instancePath+"/threat_registry_summary/status_counts/NOT_TRIGGERED",schemaPath:"#/properties/threat_registry_summary/properties/status_counts/properties/NOT_TRIGGERED/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
}
if(data18.NOT_APPLICABLE !== undefined){
let data22 = data18.NOT_APPLICABLE;
if(!((typeof data22 == "number") && (!(data22 % 1) && !isNaN(data22)))){
const err57 = {instancePath:instancePath+"/threat_registry_summary/status_counts/NOT_APPLICABLE",schemaPath:"#/properties/threat_registry_summary/properties/status_counts/properties/NOT_APPLICABLE/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(typeof data22 == "number"){
if(data22 < 0 || isNaN(data22)){
const err58 = {instancePath:instancePath+"/threat_registry_summary/status_counts/NOT_APPLICABLE",schemaPath:"#/properties/threat_registry_summary/properties/status_counts/properties/NOT_APPLICABLE/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
}
if(data18.INSUFFICIENT_EVIDENCE !== undefined){
let data23 = data18.INSUFFICIENT_EVIDENCE;
if(!((typeof data23 == "number") && (!(data23 % 1) && !isNaN(data23)))){
const err59 = {instancePath:instancePath+"/threat_registry_summary/status_counts/INSUFFICIENT_EVIDENCE",schemaPath:"#/properties/threat_registry_summary/properties/status_counts/properties/INSUFFICIENT_EVIDENCE/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(typeof data23 == "number"){
if(data23 < 0 || isNaN(data23)){
const err60 = {instancePath:instancePath+"/threat_registry_summary/status_counts/INSUFFICIENT_EVIDENCE",schemaPath:"#/properties/threat_registry_summary/properties/status_counts/properties/INSUFFICIENT_EVIDENCE/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
}
}
}
else {
const err61 = {instancePath:instancePath+"/threat_registry_summary/status_counts",schemaPath:"#/properties/threat_registry_summary/properties/status_counts/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
}
if(data15.counts_by_pain_tier !== undefined){
let data24 = data15.counts_by_pain_tier;
if(data24 && typeof data24 == "object" && !Array.isArray(data24)){
for(const key2 in data24){
let data25 = data24[key2];
if(!((typeof data25 == "number") && (!(data25 % 1) && !isNaN(data25)))){
const err62 = {instancePath:instancePath+"/threat_registry_summary/counts_by_pain_tier/" + key2.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/properties/threat_registry_summary/properties/counts_by_pain_tier/additionalProperties/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
if(typeof data25 == "number"){
if(data25 < 0 || isNaN(data25)){
const err63 = {instancePath:instancePath+"/threat_registry_summary/counts_by_pain_tier/" + key2.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/properties/threat_registry_summary/properties/counts_by_pain_tier/additionalProperties/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
}
}
else {
const err64 = {instancePath:instancePath+"/threat_registry_summary/counts_by_pain_tier",schemaPath:"#/properties/threat_registry_summary/properties/counts_by_pain_tier/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
}
if(data15.counts_by_pain_category !== undefined){
let data26 = data15.counts_by_pain_category;
if(data26 && typeof data26 == "object" && !Array.isArray(data26)){
for(const key3 in data26){
let data27 = data26[key3];
if(!((typeof data27 == "number") && (!(data27 % 1) && !isNaN(data27)))){
const err65 = {instancePath:instancePath+"/threat_registry_summary/counts_by_pain_category/" + key3.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/properties/threat_registry_summary/properties/counts_by_pain_category/additionalProperties/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
if(typeof data27 == "number"){
if(data27 < 0 || isNaN(data27)){
const err66 = {instancePath:instancePath+"/threat_registry_summary/counts_by_pain_category/" + key3.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/properties/threat_registry_summary/properties/counts_by_pain_category/additionalProperties/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
}
}
else {
const err67 = {instancePath:instancePath+"/threat_registry_summary/counts_by_pain_category",schemaPath:"#/properties/threat_registry_summary/properties/counts_by_pain_category/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
}
if(data15.counts_by_archetype !== undefined){
let data28 = data15.counts_by_archetype;
if(data28 && typeof data28 == "object" && !Array.isArray(data28)){
for(const key4 in data28){
let data29 = data28[key4];
if(!((typeof data29 == "number") && (!(data29 % 1) && !isNaN(data29)))){
const err68 = {instancePath:instancePath+"/threat_registry_summary/counts_by_archetype/" + key4.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/properties/threat_registry_summary/properties/counts_by_archetype/additionalProperties/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
if(typeof data29 == "number"){
if(data29 < 0 || isNaN(data29)){
const err69 = {instancePath:instancePath+"/threat_registry_summary/counts_by_archetype/" + key4.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/properties/threat_registry_summary/properties/counts_by_archetype/additionalProperties/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
}
}
}
else {
const err70 = {instancePath:instancePath+"/threat_registry_summary/counts_by_archetype",schemaPath:"#/properties/threat_registry_summary/properties/counts_by_archetype/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
}
if(data15.counts_by_surface !== undefined){
let data30 = data15.counts_by_surface;
if(data30 && typeof data30 == "object" && !Array.isArray(data30)){
for(const key5 in data30){
let data31 = data30[key5];
if(!((typeof data31 == "number") && (!(data31 % 1) && !isNaN(data31)))){
const err71 = {instancePath:instancePath+"/threat_registry_summary/counts_by_surface/" + key5.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/properties/threat_registry_summary/properties/counts_by_surface/additionalProperties/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
if(typeof data31 == "number"){
if(data31 < 0 || isNaN(data31)){
const err72 = {instancePath:instancePath+"/threat_registry_summary/counts_by_surface/" + key5.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/properties/threat_registry_summary/properties/counts_by_surface/additionalProperties/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
}
}
}
else {
const err73 = {instancePath:instancePath+"/threat_registry_summary/counts_by_surface",schemaPath:"#/properties/threat_registry_summary/properties/counts_by_surface/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
}
if(data15.counts_by_lane !== undefined){
let data32 = data15.counts_by_lane;
if(data32 && typeof data32 == "object" && !Array.isArray(data32)){
for(const key6 in data32){
let data33 = data32[key6];
if(!((typeof data33 == "number") && (!(data33 % 1) && !isNaN(data33)))){
const err74 = {instancePath:instancePath+"/threat_registry_summary/counts_by_lane/" + key6.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/properties/threat_registry_summary/properties/counts_by_lane/additionalProperties/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
if(typeof data33 == "number"){
if(data33 < 0 || isNaN(data33)){
const err75 = {instancePath:instancePath+"/threat_registry_summary/counts_by_lane/" + key6.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/properties/threat_registry_summary/properties/counts_by_lane/additionalProperties/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
}
}
}
else {
const err76 = {instancePath:instancePath+"/threat_registry_summary/counts_by_lane",schemaPath:"#/properties/threat_registry_summary/properties/counts_by_lane/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
}
if(data15.operator_challenge_result !== undefined){
if(typeof data15.operator_challenge_result !== "string"){
const err77 = {instancePath:instancePath+"/threat_registry_summary/operator_challenge_result",schemaPath:"#/properties/threat_registry_summary/properties/operator_challenge_result/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
}
if(data15.reopened_count !== undefined){
let data35 = data15.reopened_count;
if(!((typeof data35 == "number") && (!(data35 % 1) && !isNaN(data35)))){
const err78 = {instancePath:instancePath+"/threat_registry_summary/reopened_count",schemaPath:"#/properties/threat_registry_summary/properties/reopened_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
if(typeof data35 == "number"){
if(data35 < 0 || isNaN(data35)){
const err79 = {instancePath:instancePath+"/threat_registry_summary/reopened_count",schemaPath:"#/properties/threat_registry_summary/properties/reopened_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
}
}
if(data15.warnings !== undefined){
let data36 = data15.warnings;
if(Array.isArray(data36)){
const len3 = data36.length;
for(let i3=0; i3<len3; i3++){
if(typeof data36[i3] !== "string"){
const err80 = {instancePath:instancePath+"/threat_registry_summary/warnings/" + i3,schemaPath:"#/properties/threat_registry_summary/properties/warnings/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
}
}
else {
const err81 = {instancePath:instancePath+"/threat_registry_summary/warnings",schemaPath:"#/properties/threat_registry_summary/properties/warnings/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
}
}
else {
const err82 = {instancePath:instancePath+"/threat_registry_summary",schemaPath:"#/properties/threat_registry_summary/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
}
if(data.feature_to_threat_matrix !== undefined){
let data38 = data.feature_to_threat_matrix;
if(Array.isArray(data38)){
const len4 = data38.length;
for(let i4=0; i4<len4; i4++){
let data39 = data38[i4];
if(data39 && typeof data39 == "object" && !Array.isArray(data39)){
if(data39.feature_ref === undefined){
const err83 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4,schemaPath:"#/$defs/featureThreatMatrixItem/required",keyword:"required",params:{missingProperty: "feature_ref"},message:"must have required property '"+"feature_ref"+"'"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
if(data39.feature_name === undefined){
const err84 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4,schemaPath:"#/$defs/featureThreatMatrixItem/required",keyword:"required",params:{missingProperty: "feature_name"},message:"must have required property '"+"feature_name"+"'"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
if(data39.archetype_codes === undefined){
const err85 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4,schemaPath:"#/$defs/featureThreatMatrixItem/required",keyword:"required",params:{missingProperty: "archetype_codes"},message:"must have required property '"+"archetype_codes"+"'"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
if(data39.surface_tokens === undefined){
const err86 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4,schemaPath:"#/$defs/featureThreatMatrixItem/required",keyword:"required",params:{missingProperty: "surface_tokens"},message:"must have required property '"+"surface_tokens"+"'"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
if(data39.triggered_threat_ids === undefined){
const err87 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4,schemaPath:"#/$defs/featureThreatMatrixItem/required",keyword:"required",params:{missingProperty: "triggered_threat_ids"},message:"must have required property '"+"triggered_threat_ids"+"'"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
if(data39.controlled_threat_ids === undefined){
const err88 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4,schemaPath:"#/$defs/featureThreatMatrixItem/required",keyword:"required",params:{missingProperty: "controlled_threat_ids"},message:"must have required property '"+"controlled_threat_ids"+"'"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
if(data39.insufficient_evidence_threat_ids === undefined){
const err89 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4,schemaPath:"#/$defs/featureThreatMatrixItem/required",keyword:"required",params:{missingProperty: "insufficient_evidence_threat_ids"},message:"must have required property '"+"insufficient_evidence_threat_ids"+"'"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
if(data39.not_triggered_threat_ids === undefined){
const err90 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4,schemaPath:"#/$defs/featureThreatMatrixItem/required",keyword:"required",params:{missingProperty: "not_triggered_threat_ids"},message:"must have required property '"+"not_triggered_threat_ids"+"'"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
if(data39.not_applicable_threat_ids === undefined){
const err91 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4,schemaPath:"#/$defs/featureThreatMatrixItem/required",keyword:"required",params:{missingProperty: "not_applicable_threat_ids"},message:"must have required property '"+"not_applicable_threat_ids"+"'"};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
if(data39.document_routes === undefined){
const err92 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4,schemaPath:"#/$defs/featureThreatMatrixItem/required",keyword:"required",params:{missingProperty: "document_routes"},message:"must have required property '"+"document_routes"+"'"};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
if(data39.summary === undefined){
const err93 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4,schemaPath:"#/$defs/featureThreatMatrixItem/required",keyword:"required",params:{missingProperty: "summary"},message:"must have required property '"+"summary"+"'"};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
if(data39.feature_ref !== undefined){
if(typeof data39.feature_ref !== "string"){
const err94 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4+"/feature_ref",schemaPath:"#/$defs/featureThreatMatrixItem/properties/feature_ref/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
}
if(data39.feature_name !== undefined){
if(typeof data39.feature_name !== "string"){
const err95 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4+"/feature_name",schemaPath:"#/$defs/featureThreatMatrixItem/properties/feature_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
}
if(data39.archetype_codes !== undefined){
let data42 = data39.archetype_codes;
if(Array.isArray(data42)){
const len5 = data42.length;
for(let i5=0; i5<len5; i5++){
if(typeof data42[i5] !== "string"){
const err96 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4+"/archetype_codes/" + i5,schemaPath:"#/$defs/featureThreatMatrixItem/properties/archetype_codes/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
}
}
else {
const err97 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4+"/archetype_codes",schemaPath:"#/$defs/featureThreatMatrixItem/properties/archetype_codes/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
}
if(data39.surface_tokens !== undefined){
let data44 = data39.surface_tokens;
if(Array.isArray(data44)){
const len6 = data44.length;
for(let i6=0; i6<len6; i6++){
if(typeof data44[i6] !== "string"){
const err98 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4+"/surface_tokens/" + i6,schemaPath:"#/$defs/featureThreatMatrixItem/properties/surface_tokens/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
}
}
else {
const err99 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4+"/surface_tokens",schemaPath:"#/$defs/featureThreatMatrixItem/properties/surface_tokens/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err99];
}
else {
vErrors.push(err99);
}
errors++;
}
}
if(data39.triggered_threat_ids !== undefined){
let data46 = data39.triggered_threat_ids;
if(Array.isArray(data46)){
const len7 = data46.length;
for(let i7=0; i7<len7; i7++){
if(typeof data46[i7] !== "string"){
const err100 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4+"/triggered_threat_ids/" + i7,schemaPath:"#/$defs/featureThreatMatrixItem/properties/triggered_threat_ids/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
}
}
else {
const err101 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4+"/triggered_threat_ids",schemaPath:"#/$defs/featureThreatMatrixItem/properties/triggered_threat_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
}
if(data39.controlled_threat_ids !== undefined){
let data48 = data39.controlled_threat_ids;
if(Array.isArray(data48)){
const len8 = data48.length;
for(let i8=0; i8<len8; i8++){
if(typeof data48[i8] !== "string"){
const err102 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4+"/controlled_threat_ids/" + i8,schemaPath:"#/$defs/featureThreatMatrixItem/properties/controlled_threat_ids/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
}
}
else {
const err103 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4+"/controlled_threat_ids",schemaPath:"#/$defs/featureThreatMatrixItem/properties/controlled_threat_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
}
if(data39.insufficient_evidence_threat_ids !== undefined){
let data50 = data39.insufficient_evidence_threat_ids;
if(Array.isArray(data50)){
const len9 = data50.length;
for(let i9=0; i9<len9; i9++){
if(typeof data50[i9] !== "string"){
const err104 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4+"/insufficient_evidence_threat_ids/" + i9,schemaPath:"#/$defs/featureThreatMatrixItem/properties/insufficient_evidence_threat_ids/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err104];
}
else {
vErrors.push(err104);
}
errors++;
}
}
}
else {
const err105 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4+"/insufficient_evidence_threat_ids",schemaPath:"#/$defs/featureThreatMatrixItem/properties/insufficient_evidence_threat_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
}
if(data39.not_triggered_threat_ids !== undefined){
let data52 = data39.not_triggered_threat_ids;
if(Array.isArray(data52)){
const len10 = data52.length;
for(let i10=0; i10<len10; i10++){
if(typeof data52[i10] !== "string"){
const err106 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4+"/not_triggered_threat_ids/" + i10,schemaPath:"#/$defs/featureThreatMatrixItem/properties/not_triggered_threat_ids/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err106];
}
else {
vErrors.push(err106);
}
errors++;
}
}
}
else {
const err107 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4+"/not_triggered_threat_ids",schemaPath:"#/$defs/featureThreatMatrixItem/properties/not_triggered_threat_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
}
if(data39.not_applicable_threat_ids !== undefined){
let data54 = data39.not_applicable_threat_ids;
if(Array.isArray(data54)){
const len11 = data54.length;
for(let i11=0; i11<len11; i11++){
if(typeof data54[i11] !== "string"){
const err108 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4+"/not_applicable_threat_ids/" + i11,schemaPath:"#/$defs/featureThreatMatrixItem/properties/not_applicable_threat_ids/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err108];
}
else {
vErrors.push(err108);
}
errors++;
}
}
}
else {
const err109 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4+"/not_applicable_threat_ids",schemaPath:"#/$defs/featureThreatMatrixItem/properties/not_applicable_threat_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
}
if(data39.document_routes !== undefined){
let data56 = data39.document_routes;
if(Array.isArray(data56)){
const len12 = data56.length;
for(let i12=0; i12<len12; i12++){
if(typeof data56[i12] !== "string"){
const err110 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4+"/document_routes/" + i12,schemaPath:"#/$defs/featureThreatMatrixItem/properties/document_routes/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err110];
}
else {
vErrors.push(err110);
}
errors++;
}
}
}
else {
const err111 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4+"/document_routes",schemaPath:"#/$defs/featureThreatMatrixItem/properties/document_routes/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err111];
}
else {
vErrors.push(err111);
}
errors++;
}
}
if(data39.summary !== undefined){
if(typeof data39.summary !== "string"){
const err112 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4+"/summary",schemaPath:"#/$defs/featureThreatMatrixItem/properties/summary/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err112];
}
else {
vErrors.push(err112);
}
errors++;
}
}
}
else {
const err113 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i4,schemaPath:"#/$defs/featureThreatMatrixItem/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err113];
}
else {
vErrors.push(err113);
}
errors++;
}
}
}
else {
const err114 = {instancePath:instancePath+"/feature_to_threat_matrix",schemaPath:"#/properties/feature_to_threat_matrix/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err114];
}
else {
vErrors.push(err114);
}
errors++;
}
}
if(data.findings !== undefined){
let data59 = data.findings;
if(Array.isArray(data59)){
const len13 = data59.length;
for(let i13=0; i13<len13; i13++){
if(!(validate35(data59[i13], {instancePath:instancePath+"/findings/" + i13,parentData:data59,parentDataProperty:i13,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate35.errors : vErrors.concat(validate35.errors);
errors = vErrors.length;
}
}
}
else {
const err115 = {instancePath:instancePath+"/findings",schemaPath:"#/properties/findings/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err115];
}
else {
vErrors.push(err115);
}
errors++;
}
}
if(data.controlled_rows !== undefined){
let data61 = data.controlled_rows;
if(Array.isArray(data61)){
const len14 = data61.length;
for(let i14=0; i14<len14; i14++){
let data62 = data61[i14];
if(data62 && typeof data62 == "object" && !Array.isArray(data62)){
if(data62.threat_id === undefined){
const err116 = {instancePath:instancePath+"/controlled_rows/" + i14,schemaPath:"#/$defs/controlledRow/required",keyword:"required",params:{missingProperty: "threat_id"},message:"must have required property '"+"threat_id"+"'"};
if(vErrors === null){
vErrors = [err116];
}
else {
vErrors.push(err116);
}
errors++;
}
if(data62.threat_name === undefined){
const err117 = {instancePath:instancePath+"/controlled_rows/" + i14,schemaPath:"#/$defs/controlledRow/required",keyword:"required",params:{missingProperty: "threat_name"},message:"must have required property '"+"threat_name"+"'"};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
if(data62.status === undefined){
const err118 = {instancePath:instancePath+"/controlled_rows/" + i14,schemaPath:"#/$defs/controlledRow/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
if(data62.linked_feature_ids === undefined){
const err119 = {instancePath:instancePath+"/controlled_rows/" + i14,schemaPath:"#/$defs/controlledRow/required",keyword:"required",params:{missingProperty: "linked_feature_ids"},message:"must have required property '"+"linked_feature_ids"+"'"};
if(vErrors === null){
vErrors = [err119];
}
else {
vErrors.push(err119);
}
errors++;
}
if(data62.control_basis === undefined){
const err120 = {instancePath:instancePath+"/controlled_rows/" + i14,schemaPath:"#/$defs/controlledRow/required",keyword:"required",params:{missingProperty: "control_basis"},message:"must have required property '"+"control_basis"+"'"};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
if(data62.evidence_ref === undefined){
const err121 = {instancePath:instancePath+"/controlled_rows/" + i14,schemaPath:"#/$defs/controlledRow/required",keyword:"required",params:{missingProperty: "evidence_ref"},message:"must have required property '"+"evidence_ref"+"'"};
if(vErrors === null){
vErrors = [err121];
}
else {
vErrors.push(err121);
}
errors++;
}
if(data62.reasoning_summary === undefined){
const err122 = {instancePath:instancePath+"/controlled_rows/" + i14,schemaPath:"#/$defs/controlledRow/required",keyword:"required",params:{missingProperty: "reasoning_summary"},message:"must have required property '"+"reasoning_summary"+"'"};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
if(data62.document_routes === undefined){
const err123 = {instancePath:instancePath+"/controlled_rows/" + i14,schemaPath:"#/$defs/controlledRow/required",keyword:"required",params:{missingProperty: "document_routes"},message:"must have required property '"+"document_routes"+"'"};
if(vErrors === null){
vErrors = [err123];
}
else {
vErrors.push(err123);
}
errors++;
}
if(data62.technical_note === undefined){
const err124 = {instancePath:instancePath+"/controlled_rows/" + i14,schemaPath:"#/$defs/controlledRow/required",keyword:"required",params:{missingProperty: "technical_note"},message:"must have required property '"+"technical_note"+"'"};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
if(data62.threat_id !== undefined){
if(typeof data62.threat_id !== "string"){
const err125 = {instancePath:instancePath+"/controlled_rows/" + i14+"/threat_id",schemaPath:"#/$defs/controlledRow/properties/threat_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err125];
}
else {
vErrors.push(err125);
}
errors++;
}
}
if(data62.threat_name !== undefined){
if(typeof data62.threat_name !== "string"){
const err126 = {instancePath:instancePath+"/controlled_rows/" + i14+"/threat_name",schemaPath:"#/$defs/controlledRow/properties/threat_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err126];
}
else {
vErrors.push(err126);
}
errors++;
}
}
if(data62.status !== undefined){
if("CONTROLLED" !== data62.status){
const err127 = {instancePath:instancePath+"/controlled_rows/" + i14+"/status",schemaPath:"#/$defs/controlledRow/properties/status/const",keyword:"const",params:{allowedValue: "CONTROLLED"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err127];
}
else {
vErrors.push(err127);
}
errors++;
}
}
if(data62.linked_feature_ids !== undefined){
let data66 = data62.linked_feature_ids;
if(Array.isArray(data66)){
const len15 = data66.length;
for(let i15=0; i15<len15; i15++){
if(typeof data66[i15] !== "string"){
const err128 = {instancePath:instancePath+"/controlled_rows/" + i14+"/linked_feature_ids/" + i15,schemaPath:"#/$defs/controlledRow/properties/linked_feature_ids/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err128];
}
else {
vErrors.push(err128);
}
errors++;
}
}
}
else {
const err129 = {instancePath:instancePath+"/controlled_rows/" + i14+"/linked_feature_ids",schemaPath:"#/$defs/controlledRow/properties/linked_feature_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err129];
}
else {
vErrors.push(err129);
}
errors++;
}
}
if(data62.control_basis !== undefined){
if(typeof data62.control_basis !== "string"){
const err130 = {instancePath:instancePath+"/controlled_rows/" + i14+"/control_basis",schemaPath:"#/$defs/controlledRow/properties/control_basis/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err130];
}
else {
vErrors.push(err130);
}
errors++;
}
}
if(data62.evidence_ref !== undefined){
if(typeof data62.evidence_ref !== "string"){
const err131 = {instancePath:instancePath+"/controlled_rows/" + i14+"/evidence_ref",schemaPath:"#/$defs/controlledRow/properties/evidence_ref/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err131];
}
else {
vErrors.push(err131);
}
errors++;
}
}
if(data62.reasoning_summary !== undefined){
if(typeof data62.reasoning_summary !== "string"){
const err132 = {instancePath:instancePath+"/controlled_rows/" + i14+"/reasoning_summary",schemaPath:"#/$defs/controlledRow/properties/reasoning_summary/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err132];
}
else {
vErrors.push(err132);
}
errors++;
}
}
if(data62.document_routes !== undefined){
let data71 = data62.document_routes;
if(Array.isArray(data71)){
const len16 = data71.length;
for(let i16=0; i16<len16; i16++){
if(typeof data71[i16] !== "string"){
const err133 = {instancePath:instancePath+"/controlled_rows/" + i14+"/document_routes/" + i16,schemaPath:"#/$defs/controlledRow/properties/document_routes/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err133];
}
else {
vErrors.push(err133);
}
errors++;
}
}
}
else {
const err134 = {instancePath:instancePath+"/controlled_rows/" + i14+"/document_routes",schemaPath:"#/$defs/controlledRow/properties/document_routes/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err134];
}
else {
vErrors.push(err134);
}
errors++;
}
}
if(data62.technical_note !== undefined){
if(typeof data62.technical_note !== "string"){
const err135 = {instancePath:instancePath+"/controlled_rows/" + i14+"/technical_note",schemaPath:"#/$defs/controlledRow/properties/technical_note/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err135];
}
else {
vErrors.push(err135);
}
errors++;
}
}
}
else {
const err136 = {instancePath:instancePath+"/controlled_rows/" + i14,schemaPath:"#/$defs/controlledRow/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err136];
}
else {
vErrors.push(err136);
}
errors++;
}
}
}
else {
const err137 = {instancePath:instancePath+"/controlled_rows",schemaPath:"#/properties/controlled_rows/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err137];
}
else {
vErrors.push(err137);
}
errors++;
}
}
if(data.insufficient_evidence_rows !== undefined){
let data74 = data.insufficient_evidence_rows;
if(Array.isArray(data74)){
const len17 = data74.length;
for(let i17=0; i17<len17; i17++){
let data75 = data74[i17];
if(data75 && typeof data75 == "object" && !Array.isArray(data75)){
if(data75.threat_id === undefined){
const err138 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i17,schemaPath:"#/$defs/insufficientEvidenceRow/required",keyword:"required",params:{missingProperty: "threat_id"},message:"must have required property '"+"threat_id"+"'"};
if(vErrors === null){
vErrors = [err138];
}
else {
vErrors.push(err138);
}
errors++;
}
if(data75.threat_name === undefined){
const err139 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i17,schemaPath:"#/$defs/insufficientEvidenceRow/required",keyword:"required",params:{missingProperty: "threat_name"},message:"must have required property '"+"threat_name"+"'"};
if(vErrors === null){
vErrors = [err139];
}
else {
vErrors.push(err139);
}
errors++;
}
if(data75.status === undefined){
const err140 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i17,schemaPath:"#/$defs/insufficientEvidenceRow/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err140];
}
else {
vErrors.push(err140);
}
errors++;
}
if(data75.linked_feature_ids === undefined){
const err141 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i17,schemaPath:"#/$defs/insufficientEvidenceRow/required",keyword:"required",params:{missingProperty: "linked_feature_ids"},message:"must have required property '"+"linked_feature_ids"+"'"};
if(vErrors === null){
vErrors = [err141];
}
else {
vErrors.push(err141);
}
errors++;
}
if(data75.missing_evidence === undefined){
const err142 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i17,schemaPath:"#/$defs/insufficientEvidenceRow/required",keyword:"required",params:{missingProperty: "missing_evidence"},message:"must have required property '"+"missing_evidence"+"'"};
if(vErrors === null){
vErrors = [err142];
}
else {
vErrors.push(err142);
}
errors++;
}
if(data75.evidence_ref === undefined){
const err143 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i17,schemaPath:"#/$defs/insufficientEvidenceRow/required",keyword:"required",params:{missingProperty: "evidence_ref"},message:"must have required property '"+"evidence_ref"+"'"};
if(vErrors === null){
vErrors = [err143];
}
else {
vErrors.push(err143);
}
errors++;
}
if(data75.reasoning_summary === undefined){
const err144 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i17,schemaPath:"#/$defs/insufficientEvidenceRow/required",keyword:"required",params:{missingProperty: "reasoning_summary"},message:"must have required property '"+"reasoning_summary"+"'"};
if(vErrors === null){
vErrors = [err144];
}
else {
vErrors.push(err144);
}
errors++;
}
if(data75.recommended_follow_up === undefined){
const err145 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i17,schemaPath:"#/$defs/insufficientEvidenceRow/required",keyword:"required",params:{missingProperty: "recommended_follow_up"},message:"must have required property '"+"recommended_follow_up"+"'"};
if(vErrors === null){
vErrors = [err145];
}
else {
vErrors.push(err145);
}
errors++;
}
if(data75.technical_note === undefined){
const err146 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i17,schemaPath:"#/$defs/insufficientEvidenceRow/required",keyword:"required",params:{missingProperty: "technical_note"},message:"must have required property '"+"technical_note"+"'"};
if(vErrors === null){
vErrors = [err146];
}
else {
vErrors.push(err146);
}
errors++;
}
if(data75.threat_id !== undefined){
if(typeof data75.threat_id !== "string"){
const err147 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i17+"/threat_id",schemaPath:"#/$defs/insufficientEvidenceRow/properties/threat_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err147];
}
else {
vErrors.push(err147);
}
errors++;
}
}
if(data75.threat_name !== undefined){
if(typeof data75.threat_name !== "string"){
const err148 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i17+"/threat_name",schemaPath:"#/$defs/insufficientEvidenceRow/properties/threat_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err148];
}
else {
vErrors.push(err148);
}
errors++;
}
}
if(data75.status !== undefined){
if("INSUFFICIENT_EVIDENCE" !== data75.status){
const err149 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i17+"/status",schemaPath:"#/$defs/insufficientEvidenceRow/properties/status/const",keyword:"const",params:{allowedValue: "INSUFFICIENT_EVIDENCE"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err149];
}
else {
vErrors.push(err149);
}
errors++;
}
}
if(data75.linked_feature_ids !== undefined){
let data79 = data75.linked_feature_ids;
if(Array.isArray(data79)){
const len18 = data79.length;
for(let i18=0; i18<len18; i18++){
if(typeof data79[i18] !== "string"){
const err150 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i17+"/linked_feature_ids/" + i18,schemaPath:"#/$defs/insufficientEvidenceRow/properties/linked_feature_ids/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err150];
}
else {
vErrors.push(err150);
}
errors++;
}
}
}
else {
const err151 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i17+"/linked_feature_ids",schemaPath:"#/$defs/insufficientEvidenceRow/properties/linked_feature_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err151];
}
else {
vErrors.push(err151);
}
errors++;
}
}
if(data75.missing_evidence !== undefined){
if(typeof data75.missing_evidence !== "string"){
const err152 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i17+"/missing_evidence",schemaPath:"#/$defs/insufficientEvidenceRow/properties/missing_evidence/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err152];
}
else {
vErrors.push(err152);
}
errors++;
}
}
if(data75.evidence_ref !== undefined){
if(typeof data75.evidence_ref !== "string"){
const err153 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i17+"/evidence_ref",schemaPath:"#/$defs/insufficientEvidenceRow/properties/evidence_ref/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err153];
}
else {
vErrors.push(err153);
}
errors++;
}
}
if(data75.reasoning_summary !== undefined){
if(typeof data75.reasoning_summary !== "string"){
const err154 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i17+"/reasoning_summary",schemaPath:"#/$defs/insufficientEvidenceRow/properties/reasoning_summary/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err154];
}
else {
vErrors.push(err154);
}
errors++;
}
}
if(data75.recommended_follow_up !== undefined){
if(typeof data75.recommended_follow_up !== "string"){
const err155 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i17+"/recommended_follow_up",schemaPath:"#/$defs/insufficientEvidenceRow/properties/recommended_follow_up/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err155];
}
else {
vErrors.push(err155);
}
errors++;
}
}
if(data75.technical_note !== undefined){
if(typeof data75.technical_note !== "string"){
const err156 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i17+"/technical_note",schemaPath:"#/$defs/insufficientEvidenceRow/properties/technical_note/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err156];
}
else {
vErrors.push(err156);
}
errors++;
}
}
}
else {
const err157 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i17,schemaPath:"#/$defs/insufficientEvidenceRow/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err157];
}
else {
vErrors.push(err157);
}
errors++;
}
}
}
else {
const err158 = {instancePath:instancePath+"/insufficient_evidence_rows",schemaPath:"#/properties/insufficient_evidence_rows/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err158];
}
else {
vErrors.push(err158);
}
errors++;
}
}
if(data.assembly_route !== undefined){
let data86 = data.assembly_route;
if(data86 && typeof data86 == "object" && !Array.isArray(data86)){
if(data86.recommended_package === undefined){
const err159 = {instancePath:instancePath+"/assembly_route",schemaPath:"#/properties/assembly_route/required",keyword:"required",params:{missingProperty: "recommended_package"},message:"must have required property '"+"recommended_package"+"'"};
if(vErrors === null){
vErrors = [err159];
}
else {
vErrors.push(err159);
}
errors++;
}
if(data86.document_routes === undefined){
const err160 = {instancePath:instancePath+"/assembly_route",schemaPath:"#/properties/assembly_route/required",keyword:"required",params:{missingProperty: "document_routes"},message:"must have required property '"+"document_routes"+"'"};
if(vErrors === null){
vErrors = [err160];
}
else {
vErrors.push(err160);
}
errors++;
}
if(data86.route_reasoning === undefined){
const err161 = {instancePath:instancePath+"/assembly_route",schemaPath:"#/properties/assembly_route/required",keyword:"required",params:{missingProperty: "route_reasoning"},message:"must have required property '"+"route_reasoning"+"'"};
if(vErrors === null){
vErrors = [err161];
}
else {
vErrors.push(err161);
}
errors++;
}
if(data86.local_counsel_review_required === undefined){
const err162 = {instancePath:instancePath+"/assembly_route",schemaPath:"#/properties/assembly_route/required",keyword:"required",params:{missingProperty: "local_counsel_review_required"},message:"must have required property '"+"local_counsel_review_required"+"'"};
if(vErrors === null){
vErrors = [err162];
}
else {
vErrors.push(err162);
}
errors++;
}
if(data86.vault_confirmation_question_count === undefined){
const err163 = {instancePath:instancePath+"/assembly_route",schemaPath:"#/properties/assembly_route/required",keyword:"required",params:{missingProperty: "vault_confirmation_question_count"},message:"must have required property '"+"vault_confirmation_question_count"+"'"};
if(vErrors === null){
vErrors = [err163];
}
else {
vErrors.push(err163);
}
errors++;
}
if(data86.backend_assembler_note === undefined){
const err164 = {instancePath:instancePath+"/assembly_route",schemaPath:"#/properties/assembly_route/required",keyword:"required",params:{missingProperty: "backend_assembler_note"},message:"must have required property '"+"backend_assembler_note"+"'"};
if(vErrors === null){
vErrors = [err164];
}
else {
vErrors.push(err164);
}
errors++;
}
if(data86.recommended_package !== undefined){
if(typeof data86.recommended_package !== "string"){
const err165 = {instancePath:instancePath+"/assembly_route/recommended_package",schemaPath:"#/properties/assembly_route/properties/recommended_package/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err165];
}
else {
vErrors.push(err165);
}
errors++;
}
}
if(data86.document_routes !== undefined){
let data88 = data86.document_routes;
if(Array.isArray(data88)){
const len19 = data88.length;
for(let i19=0; i19<len19; i19++){
if(typeof data88[i19] !== "string"){
const err166 = {instancePath:instancePath+"/assembly_route/document_routes/" + i19,schemaPath:"#/properties/assembly_route/properties/document_routes/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err166];
}
else {
vErrors.push(err166);
}
errors++;
}
}
}
else {
const err167 = {instancePath:instancePath+"/assembly_route/document_routes",schemaPath:"#/properties/assembly_route/properties/document_routes/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err167];
}
else {
vErrors.push(err167);
}
errors++;
}
}
if(data86.route_reasoning !== undefined){
if(typeof data86.route_reasoning !== "string"){
const err168 = {instancePath:instancePath+"/assembly_route/route_reasoning",schemaPath:"#/properties/assembly_route/properties/route_reasoning/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err168];
}
else {
vErrors.push(err168);
}
errors++;
}
}
if(data86.local_counsel_review_required !== undefined){
if(typeof data86.local_counsel_review_required !== "boolean"){
const err169 = {instancePath:instancePath+"/assembly_route/local_counsel_review_required",schemaPath:"#/properties/assembly_route/properties/local_counsel_review_required/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err169];
}
else {
vErrors.push(err169);
}
errors++;
}
}
if(data86.vault_confirmation_question_count !== undefined){
let data92 = data86.vault_confirmation_question_count;
if(!((typeof data92 == "number") && (!(data92 % 1) && !isNaN(data92)))){
const err170 = {instancePath:instancePath+"/assembly_route/vault_confirmation_question_count",schemaPath:"#/properties/assembly_route/properties/vault_confirmation_question_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err170];
}
else {
vErrors.push(err170);
}
errors++;
}
if(typeof data92 == "number"){
if(data92 < 0 || isNaN(data92)){
const err171 = {instancePath:instancePath+"/assembly_route/vault_confirmation_question_count",schemaPath:"#/properties/assembly_route/properties/vault_confirmation_question_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err171];
}
else {
vErrors.push(err171);
}
errors++;
}
}
}
if(data86.backend_assembler_note !== undefined){
if(typeof data86.backend_assembler_note !== "string"){
const err172 = {instancePath:instancePath+"/assembly_route/backend_assembler_note",schemaPath:"#/properties/assembly_route/properties/backend_assembler_note/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err172];
}
else {
vErrors.push(err172);
}
errors++;
}
}
}
else {
const err173 = {instancePath:instancePath+"/assembly_route",schemaPath:"#/properties/assembly_route/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err173];
}
else {
vErrors.push(err173);
}
errors++;
}
}
if(data.report_data !== undefined){
let data94 = data.report_data;
if(data94 && typeof data94 == "object" && !Array.isArray(data94)){
if(data94.executive_report === undefined){
const err174 = {instancePath:instancePath+"/report_data",schemaPath:"#/properties/report_data/required",keyword:"required",params:{missingProperty: "executive_report"},message:"must have required property '"+"executive_report"+"'"};
if(vErrors === null){
vErrors = [err174];
}
else {
vErrors.push(err174);
}
errors++;
}
if(data94.full_forensic_record === undefined){
const err175 = {instancePath:instancePath+"/report_data",schemaPath:"#/properties/report_data/required",keyword:"required",params:{missingProperty: "full_forensic_record"},message:"must have required property '"+"full_forensic_record"+"'"};
if(vErrors === null){
vErrors = [err175];
}
else {
vErrors.push(err175);
}
errors++;
}
for(const key7 in data94){
if(!((key7 === "executive_report") || (key7 === "full_forensic_record"))){
const err176 = {instancePath:instancePath+"/report_data",schemaPath:"#/properties/report_data/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key7},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err176];
}
else {
vErrors.push(err176);
}
errors++;
}
}
if(data94.executive_report !== undefined){
let data95 = data94.executive_report;
if(data95 && typeof data95 == "object" && !Array.isArray(data95)){
if(data95.cover_and_reliance === undefined){
const err177 = {instancePath:instancePath+"/report_data/executive_report",schemaPath:"#/properties/report_data/properties/executive_report/required",keyword:"required",params:{missingProperty: "cover_and_reliance"},message:"must have required property '"+"cover_and_reliance"+"'"};
if(vErrors === null){
vErrors = [err177];
}
else {
vErrors.push(err177);
}
errors++;
}
if(data95.scope_and_methodology === undefined){
const err178 = {instancePath:instancePath+"/report_data/executive_report",schemaPath:"#/properties/report_data/properties/executive_report/required",keyword:"required",params:{missingProperty: "scope_and_methodology"},message:"must have required property '"+"scope_and_methodology"+"'"};
if(vErrors === null){
vErrors = [err178];
}
else {
vErrors.push(err178);
}
errors++;
}
if(data95.subject_profile === undefined){
const err179 = {instancePath:instancePath+"/report_data/executive_report",schemaPath:"#/properties/report_data/properties/executive_report/required",keyword:"required",params:{missingProperty: "subject_profile"},message:"must have required property '"+"subject_profile"+"'"};
if(vErrors === null){
vErrors = [err179];
}
else {
vErrors.push(err179);
}
errors++;
}
if(data95.risk_posture_summary === undefined){
const err180 = {instancePath:instancePath+"/report_data/executive_report",schemaPath:"#/properties/report_data/properties/executive_report/required",keyword:"required",params:{missingProperty: "risk_posture_summary"},message:"must have required property '"+"risk_posture_summary"+"'"};
if(vErrors === null){
vErrors = [err180];
}
else {
vErrors.push(err180);
}
errors++;
}
if(data95.material_highlights === undefined){
const err181 = {instancePath:instancePath+"/report_data/executive_report",schemaPath:"#/properties/report_data/properties/executive_report/required",keyword:"required",params:{missingProperty: "material_highlights"},message:"must have required property '"+"material_highlights"+"'"};
if(vErrors === null){
vErrors = [err181];
}
else {
vErrors.push(err181);
}
errors++;
}
if(data95.triggered_findings_schedule === undefined){
const err182 = {instancePath:instancePath+"/report_data/executive_report",schemaPath:"#/properties/report_data/properties/executive_report/required",keyword:"required",params:{missingProperty: "triggered_findings_schedule"},message:"must have required property '"+"triggered_findings_schedule"+"'"};
if(vErrors === null){
vErrors = [err182];
}
else {
vErrors.push(err182);
}
errors++;
}
if(data95.document_stack_verdict === undefined){
const err183 = {instancePath:instancePath+"/report_data/executive_report",schemaPath:"#/properties/report_data/properties/executive_report/required",keyword:"required",params:{missingProperty: "document_stack_verdict"},message:"must have required property '"+"document_stack_verdict"+"'"};
if(vErrors === null){
vErrors = [err183];
}
else {
vErrors.push(err183);
}
errors++;
}
if(data95.recommended_route === undefined){
const err184 = {instancePath:instancePath+"/report_data/executive_report",schemaPath:"#/properties/report_data/properties/executive_report/required",keyword:"required",params:{missingProperty: "recommended_route"},message:"must have required property '"+"recommended_route"+"'"};
if(vErrors === null){
vErrors = [err184];
}
else {
vErrors.push(err184);
}
errors++;
}
for(const key8 in data95){
if(!((((((((key8 === "cover_and_reliance") || (key8 === "scope_and_methodology")) || (key8 === "subject_profile")) || (key8 === "risk_posture_summary")) || (key8 === "material_highlights")) || (key8 === "triggered_findings_schedule")) || (key8 === "document_stack_verdict")) || (key8 === "recommended_route"))){
const err185 = {instancePath:instancePath+"/report_data/executive_report",schemaPath:"#/properties/report_data/properties/executive_report/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key8},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err185];
}
else {
vErrors.push(err185);
}
errors++;
}
}
if(data95.cover_and_reliance !== undefined){
let data96 = data95.cover_and_reliance;
if(data96 && typeof data96 == "object" && !Array.isArray(data96)){
}
else {
const err186 = {instancePath:instancePath+"/report_data/executive_report/cover_and_reliance",schemaPath:"#/properties/report_data/properties/executive_report/properties/cover_and_reliance/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err186];
}
else {
vErrors.push(err186);
}
errors++;
}
}
if(data95.scope_and_methodology !== undefined){
let data97 = data95.scope_and_methodology;
if(data97 && typeof data97 == "object" && !Array.isArray(data97)){
}
else {
const err187 = {instancePath:instancePath+"/report_data/executive_report/scope_and_methodology",schemaPath:"#/properties/report_data/properties/executive_report/properties/scope_and_methodology/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err187];
}
else {
vErrors.push(err187);
}
errors++;
}
}
if(data95.subject_profile !== undefined){
let data98 = data95.subject_profile;
if(data98 && typeof data98 == "object" && !Array.isArray(data98)){
}
else {
const err188 = {instancePath:instancePath+"/report_data/executive_report/subject_profile",schemaPath:"#/properties/report_data/properties/executive_report/properties/subject_profile/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err188];
}
else {
vErrors.push(err188);
}
errors++;
}
}
if(data95.risk_posture_summary !== undefined){
let data99 = data95.risk_posture_summary;
if(data99 && typeof data99 == "object" && !Array.isArray(data99)){
}
else {
const err189 = {instancePath:instancePath+"/report_data/executive_report/risk_posture_summary",schemaPath:"#/properties/report_data/properties/executive_report/properties/risk_posture_summary/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err189];
}
else {
vErrors.push(err189);
}
errors++;
}
}
if(data95.material_highlights !== undefined){
let data100 = data95.material_highlights;
if(Array.isArray(data100)){
const len20 = data100.length;
for(let i20=0; i20<len20; i20++){
let data101 = data100[i20];
if(data101 && typeof data101 == "object" && !Array.isArray(data101)){
}
else {
const err190 = {instancePath:instancePath+"/report_data/executive_report/material_highlights/" + i20,schemaPath:"#/properties/report_data/properties/executive_report/properties/material_highlights/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err190];
}
else {
vErrors.push(err190);
}
errors++;
}
}
}
else {
const err191 = {instancePath:instancePath+"/report_data/executive_report/material_highlights",schemaPath:"#/properties/report_data/properties/executive_report/properties/material_highlights/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err191];
}
else {
vErrors.push(err191);
}
errors++;
}
}
if(data95.triggered_findings_schedule !== undefined){
let data102 = data95.triggered_findings_schedule;
if(Array.isArray(data102)){
const len21 = data102.length;
for(let i21=0; i21<len21; i21++){
let data103 = data102[i21];
if(data103 && typeof data103 == "object" && !Array.isArray(data103)){
if(data103.threat_id === undefined){
const err192 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i21,schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/required",keyword:"required",params:{missingProperty: "threat_id"},message:"must have required property '"+"threat_id"+"'"};
if(vErrors === null){
vErrors = [err192];
}
else {
vErrors.push(err192);
}
errors++;
}
if(data103.threat_name === undefined){
const err193 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i21,schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/required",keyword:"required",params:{missingProperty: "threat_name"},message:"must have required property '"+"threat_name"+"'"};
if(vErrors === null){
vErrors = [err193];
}
else {
vErrors.push(err193);
}
errors++;
}
if(data103.pain_category === undefined){
const err194 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i21,schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/required",keyword:"required",params:{missingProperty: "pain_category"},message:"must have required property '"+"pain_category"+"'"};
if(vErrors === null){
vErrors = [err194];
}
else {
vErrors.push(err194);
}
errors++;
}
if(data103.archetype === undefined){
const err195 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i21,schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/required",keyword:"required",params:{missingProperty: "archetype"},message:"must have required property '"+"archetype"+"'"};
if(vErrors === null){
vErrors = [err195];
}
else {
vErrors.push(err195);
}
errors++;
}
if(data103.linked_feature === undefined){
const err196 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i21,schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/required",keyword:"required",params:{missingProperty: "linked_feature"},message:"must have required property '"+"linked_feature"+"'"};
if(vErrors === null){
vErrors = [err196];
}
else {
vErrors.push(err196);
}
errors++;
}
if(data103.document_route === undefined){
const err197 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i21,schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/required",keyword:"required",params:{missingProperty: "document_route"},message:"must have required property '"+"document_route"+"'"};
if(vErrors === null){
vErrors = [err197];
}
else {
vErrors.push(err197);
}
errors++;
}
if(data103.short_issue === undefined){
const err198 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i21,schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/required",keyword:"required",params:{missingProperty: "short_issue"},message:"must have required property '"+"short_issue"+"'"};
if(vErrors === null){
vErrors = [err198];
}
else {
vErrors.push(err198);
}
errors++;
}
for(const key9 in data103){
if(!(((((((key9 === "threat_id") || (key9 === "threat_name")) || (key9 === "pain_category")) || (key9 === "archetype")) || (key9 === "linked_feature")) || (key9 === "document_route")) || (key9 === "short_issue"))){
const err199 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i21,schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key9},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err199];
}
else {
vErrors.push(err199);
}
errors++;
}
}
if(data103.threat_id !== undefined){
if(typeof data103.threat_id !== "string"){
const err200 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i21+"/threat_id",schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/properties/threat_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err200];
}
else {
vErrors.push(err200);
}
errors++;
}
}
if(data103.threat_name !== undefined){
if(typeof data103.threat_name !== "string"){
const err201 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i21+"/threat_name",schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/properties/threat_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err201];
}
else {
vErrors.push(err201);
}
errors++;
}
}
if(data103.pain_category !== undefined){
if(typeof data103.pain_category !== "string"){
const err202 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i21+"/pain_category",schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/properties/pain_category/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err202];
}
else {
vErrors.push(err202);
}
errors++;
}
}
if(data103.archetype !== undefined){
if(typeof data103.archetype !== "string"){
const err203 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i21+"/archetype",schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/properties/archetype/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err203];
}
else {
vErrors.push(err203);
}
errors++;
}
}
if(data103.linked_feature !== undefined){
if(typeof data103.linked_feature !== "string"){
const err204 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i21+"/linked_feature",schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/properties/linked_feature/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err204];
}
else {
vErrors.push(err204);
}
errors++;
}
}
if(data103.document_route !== undefined){
if(typeof data103.document_route !== "string"){
const err205 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i21+"/document_route",schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/properties/document_route/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err205];
}
else {
vErrors.push(err205);
}
errors++;
}
}
if(data103.short_issue !== undefined){
if(typeof data103.short_issue !== "string"){
const err206 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i21+"/short_issue",schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/properties/short_issue/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err206];
}
else {
vErrors.push(err206);
}
errors++;
}
}
}
else {
const err207 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i21,schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err207];
}
else {
vErrors.push(err207);
}
errors++;
}
}
}
else {
const err208 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule",schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err208];
}
else {
vErrors.push(err208);
}
errors++;
}
}
if(data95.document_stack_verdict !== undefined){
let data111 = data95.document_stack_verdict;
if(data111 && typeof data111 == "object" && !Array.isArray(data111)){
}
else {
const err209 = {instancePath:instancePath+"/report_data/executive_report/document_stack_verdict",schemaPath:"#/properties/report_data/properties/executive_report/properties/document_stack_verdict/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err209];
}
else {
vErrors.push(err209);
}
errors++;
}
}
if(data95.recommended_route !== undefined){
let data112 = data95.recommended_route;
if(data112 && typeof data112 == "object" && !Array.isArray(data112)){
}
else {
const err210 = {instancePath:instancePath+"/report_data/executive_report/recommended_route",schemaPath:"#/properties/report_data/properties/executive_report/properties/recommended_route/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err210];
}
else {
vErrors.push(err210);
}
errors++;
}
}
}
else {
const err211 = {instancePath:instancePath+"/report_data/executive_report",schemaPath:"#/properties/report_data/properties/executive_report/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err211];
}
else {
vErrors.push(err211);
}
errors++;
}
}
if(data94.full_forensic_record !== undefined){
let data113 = data94.full_forensic_record;
if(data113 && typeof data113 == "object" && !Array.isArray(data113)){
if(data113.source_review === undefined){
const err212 = {instancePath:instancePath+"/report_data/full_forensic_record",schemaPath:"#/properties/report_data/properties/full_forensic_record/required",keyword:"required",params:{missingProperty: "source_review"},message:"must have required property '"+"source_review"+"'"};
if(vErrors === null){
vErrors = [err212];
}
else {
vErrors.push(err212);
}
errors++;
}
if(data113.artifact_inventory === undefined){
const err213 = {instancePath:instancePath+"/report_data/full_forensic_record",schemaPath:"#/properties/report_data/properties/full_forensic_record/required",keyword:"required",params:{missingProperty: "artifact_inventory"},message:"must have required property '"+"artifact_inventory"+"'"};
if(vErrors === null){
vErrors = [err213];
}
else {
vErrors.push(err213);
}
errors++;
}
if(data113.product_feature_map === undefined){
const err214 = {instancePath:instancePath+"/report_data/full_forensic_record",schemaPath:"#/properties/report_data/properties/full_forensic_record/required",keyword:"required",params:{missingProperty: "product_feature_map"},message:"must have required property '"+"product_feature_map"+"'"};
if(vErrors === null){
vErrors = [err214];
}
else {
vErrors.push(err214);
}
errors++;
}
if(data113.feature_to_threat_matrix === undefined){
const err215 = {instancePath:instancePath+"/report_data/full_forensic_record",schemaPath:"#/properties/report_data/properties/full_forensic_record/required",keyword:"required",params:{missingProperty: "feature_to_threat_matrix"},message:"must have required property '"+"feature_to_threat_matrix"+"'"};
if(vErrors === null){
vErrors = [err215];
}
else {
vErrors.push(err215);
}
errors++;
}
if(data113.document_stack_redline === undefined){
const err216 = {instancePath:instancePath+"/report_data/full_forensic_record",schemaPath:"#/properties/report_data/properties/full_forensic_record/required",keyword:"required",params:{missingProperty: "document_stack_redline"},message:"must have required property '"+"document_stack_redline"+"'"};
if(vErrors === null){
vErrors = [err216];
}
else {
vErrors.push(err216);
}
errors++;
}
if(data113.triggered_findings === undefined){
const err217 = {instancePath:instancePath+"/report_data/full_forensic_record",schemaPath:"#/properties/report_data/properties/full_forensic_record/required",keyword:"required",params:{missingProperty: "triggered_findings"},message:"must have required property '"+"triggered_findings"+"'"};
if(vErrors === null){
vErrors = [err217];
}
else {
vErrors.push(err217);
}
errors++;
}
if(data113.controlled_rows === undefined){
const err218 = {instancePath:instancePath+"/report_data/full_forensic_record",schemaPath:"#/properties/report_data/properties/full_forensic_record/required",keyword:"required",params:{missingProperty: "controlled_rows"},message:"must have required property '"+"controlled_rows"+"'"};
if(vErrors === null){
vErrors = [err218];
}
else {
vErrors.push(err218);
}
errors++;
}
if(data113.insufficient_evidence_rows === undefined){
const err219 = {instancePath:instancePath+"/report_data/full_forensic_record",schemaPath:"#/properties/report_data/properties/full_forensic_record/required",keyword:"required",params:{missingProperty: "insufficient_evidence_rows"},message:"must have required property '"+"insufficient_evidence_rows"+"'"};
if(vErrors === null){
vErrors = [err219];
}
else {
vErrors.push(err219);
}
errors++;
}
if(data113.assembly_route === undefined){
const err220 = {instancePath:instancePath+"/report_data/full_forensic_record",schemaPath:"#/properties/report_data/properties/full_forensic_record/required",keyword:"required",params:{missingProperty: "assembly_route"},message:"must have required property '"+"assembly_route"+"'"};
if(vErrors === null){
vErrors = [err220];
}
else {
vErrors.push(err220);
}
errors++;
}
if(data113.technical_audit_log === undefined){
const err221 = {instancePath:instancePath+"/report_data/full_forensic_record",schemaPath:"#/properties/report_data/properties/full_forensic_record/required",keyword:"required",params:{missingProperty: "technical_audit_log"},message:"must have required property '"+"technical_audit_log"+"'"};
if(vErrors === null){
vErrors = [err221];
}
else {
vErrors.push(err221);
}
errors++;
}
for(const key10 in data113){
if(!(func1.call(schema52.properties.report_data.properties.full_forensic_record.properties, key10))){
const err222 = {instancePath:instancePath+"/report_data/full_forensic_record",schemaPath:"#/properties/report_data/properties/full_forensic_record/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key10},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err222];
}
else {
vErrors.push(err222);
}
errors++;
}
}
if(data113.source_review !== undefined){
let data114 = data113.source_review;
if(data114 && typeof data114 == "object" && !Array.isArray(data114)){
}
else {
const err223 = {instancePath:instancePath+"/report_data/full_forensic_record/source_review",schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/source_review/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err223];
}
else {
vErrors.push(err223);
}
errors++;
}
}
if(data113.artifact_inventory !== undefined){
let data115 = data113.artifact_inventory;
if(Array.isArray(data115)){
const len22 = data115.length;
for(let i22=0; i22<len22; i22++){
let data116 = data115[i22];
if(data116 && typeof data116 == "object" && !Array.isArray(data116)){
}
else {
const err224 = {instancePath:instancePath+"/report_data/full_forensic_record/artifact_inventory/" + i22,schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/artifact_inventory/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err224];
}
else {
vErrors.push(err224);
}
errors++;
}
}
}
else {
const err225 = {instancePath:instancePath+"/report_data/full_forensic_record/artifact_inventory",schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/artifact_inventory/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err225];
}
else {
vErrors.push(err225);
}
errors++;
}
}
if(data113.product_feature_map !== undefined){
let data117 = data113.product_feature_map;
if(Array.isArray(data117)){
const len23 = data117.length;
for(let i23=0; i23<len23; i23++){
let data118 = data117[i23];
if(data118 && typeof data118 == "object" && !Array.isArray(data118)){
}
else {
const err226 = {instancePath:instancePath+"/report_data/full_forensic_record/product_feature_map/" + i23,schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/product_feature_map/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err226];
}
else {
vErrors.push(err226);
}
errors++;
}
}
}
else {
const err227 = {instancePath:instancePath+"/report_data/full_forensic_record/product_feature_map",schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/product_feature_map/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err227];
}
else {
vErrors.push(err227);
}
errors++;
}
}
if(data113.feature_to_threat_matrix !== undefined){
let data119 = data113.feature_to_threat_matrix;
if(Array.isArray(data119)){
const len24 = data119.length;
for(let i24=0; i24<len24; i24++){
let data120 = data119[i24];
if(data120 && typeof data120 == "object" && !Array.isArray(data120)){
if(data120.feature_ref === undefined){
const err228 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24,schemaPath:"#/$defs/featureThreatMatrixItem/required",keyword:"required",params:{missingProperty: "feature_ref"},message:"must have required property '"+"feature_ref"+"'"};
if(vErrors === null){
vErrors = [err228];
}
else {
vErrors.push(err228);
}
errors++;
}
if(data120.feature_name === undefined){
const err229 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24,schemaPath:"#/$defs/featureThreatMatrixItem/required",keyword:"required",params:{missingProperty: "feature_name"},message:"must have required property '"+"feature_name"+"'"};
if(vErrors === null){
vErrors = [err229];
}
else {
vErrors.push(err229);
}
errors++;
}
if(data120.archetype_codes === undefined){
const err230 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24,schemaPath:"#/$defs/featureThreatMatrixItem/required",keyword:"required",params:{missingProperty: "archetype_codes"},message:"must have required property '"+"archetype_codes"+"'"};
if(vErrors === null){
vErrors = [err230];
}
else {
vErrors.push(err230);
}
errors++;
}
if(data120.surface_tokens === undefined){
const err231 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24,schemaPath:"#/$defs/featureThreatMatrixItem/required",keyword:"required",params:{missingProperty: "surface_tokens"},message:"must have required property '"+"surface_tokens"+"'"};
if(vErrors === null){
vErrors = [err231];
}
else {
vErrors.push(err231);
}
errors++;
}
if(data120.triggered_threat_ids === undefined){
const err232 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24,schemaPath:"#/$defs/featureThreatMatrixItem/required",keyword:"required",params:{missingProperty: "triggered_threat_ids"},message:"must have required property '"+"triggered_threat_ids"+"'"};
if(vErrors === null){
vErrors = [err232];
}
else {
vErrors.push(err232);
}
errors++;
}
if(data120.controlled_threat_ids === undefined){
const err233 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24,schemaPath:"#/$defs/featureThreatMatrixItem/required",keyword:"required",params:{missingProperty: "controlled_threat_ids"},message:"must have required property '"+"controlled_threat_ids"+"'"};
if(vErrors === null){
vErrors = [err233];
}
else {
vErrors.push(err233);
}
errors++;
}
if(data120.insufficient_evidence_threat_ids === undefined){
const err234 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24,schemaPath:"#/$defs/featureThreatMatrixItem/required",keyword:"required",params:{missingProperty: "insufficient_evidence_threat_ids"},message:"must have required property '"+"insufficient_evidence_threat_ids"+"'"};
if(vErrors === null){
vErrors = [err234];
}
else {
vErrors.push(err234);
}
errors++;
}
if(data120.not_triggered_threat_ids === undefined){
const err235 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24,schemaPath:"#/$defs/featureThreatMatrixItem/required",keyword:"required",params:{missingProperty: "not_triggered_threat_ids"},message:"must have required property '"+"not_triggered_threat_ids"+"'"};
if(vErrors === null){
vErrors = [err235];
}
else {
vErrors.push(err235);
}
errors++;
}
if(data120.not_applicable_threat_ids === undefined){
const err236 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24,schemaPath:"#/$defs/featureThreatMatrixItem/required",keyword:"required",params:{missingProperty: "not_applicable_threat_ids"},message:"must have required property '"+"not_applicable_threat_ids"+"'"};
if(vErrors === null){
vErrors = [err236];
}
else {
vErrors.push(err236);
}
errors++;
}
if(data120.document_routes === undefined){
const err237 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24,schemaPath:"#/$defs/featureThreatMatrixItem/required",keyword:"required",params:{missingProperty: "document_routes"},message:"must have required property '"+"document_routes"+"'"};
if(vErrors === null){
vErrors = [err237];
}
else {
vErrors.push(err237);
}
errors++;
}
if(data120.summary === undefined){
const err238 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24,schemaPath:"#/$defs/featureThreatMatrixItem/required",keyword:"required",params:{missingProperty: "summary"},message:"must have required property '"+"summary"+"'"};
if(vErrors === null){
vErrors = [err238];
}
else {
vErrors.push(err238);
}
errors++;
}
if(data120.feature_ref !== undefined){
if(typeof data120.feature_ref !== "string"){
const err239 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24+"/feature_ref",schemaPath:"#/$defs/featureThreatMatrixItem/properties/feature_ref/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err239];
}
else {
vErrors.push(err239);
}
errors++;
}
}
if(data120.feature_name !== undefined){
if(typeof data120.feature_name !== "string"){
const err240 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24+"/feature_name",schemaPath:"#/$defs/featureThreatMatrixItem/properties/feature_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err240];
}
else {
vErrors.push(err240);
}
errors++;
}
}
if(data120.archetype_codes !== undefined){
let data123 = data120.archetype_codes;
if(Array.isArray(data123)){
const len25 = data123.length;
for(let i25=0; i25<len25; i25++){
if(typeof data123[i25] !== "string"){
const err241 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24+"/archetype_codes/" + i25,schemaPath:"#/$defs/featureThreatMatrixItem/properties/archetype_codes/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err241];
}
else {
vErrors.push(err241);
}
errors++;
}
}
}
else {
const err242 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24+"/archetype_codes",schemaPath:"#/$defs/featureThreatMatrixItem/properties/archetype_codes/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err242];
}
else {
vErrors.push(err242);
}
errors++;
}
}
if(data120.surface_tokens !== undefined){
let data125 = data120.surface_tokens;
if(Array.isArray(data125)){
const len26 = data125.length;
for(let i26=0; i26<len26; i26++){
if(typeof data125[i26] !== "string"){
const err243 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24+"/surface_tokens/" + i26,schemaPath:"#/$defs/featureThreatMatrixItem/properties/surface_tokens/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err243];
}
else {
vErrors.push(err243);
}
errors++;
}
}
}
else {
const err244 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24+"/surface_tokens",schemaPath:"#/$defs/featureThreatMatrixItem/properties/surface_tokens/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err244];
}
else {
vErrors.push(err244);
}
errors++;
}
}
if(data120.triggered_threat_ids !== undefined){
let data127 = data120.triggered_threat_ids;
if(Array.isArray(data127)){
const len27 = data127.length;
for(let i27=0; i27<len27; i27++){
if(typeof data127[i27] !== "string"){
const err245 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24+"/triggered_threat_ids/" + i27,schemaPath:"#/$defs/featureThreatMatrixItem/properties/triggered_threat_ids/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err245];
}
else {
vErrors.push(err245);
}
errors++;
}
}
}
else {
const err246 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24+"/triggered_threat_ids",schemaPath:"#/$defs/featureThreatMatrixItem/properties/triggered_threat_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err246];
}
else {
vErrors.push(err246);
}
errors++;
}
}
if(data120.controlled_threat_ids !== undefined){
let data129 = data120.controlled_threat_ids;
if(Array.isArray(data129)){
const len28 = data129.length;
for(let i28=0; i28<len28; i28++){
if(typeof data129[i28] !== "string"){
const err247 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24+"/controlled_threat_ids/" + i28,schemaPath:"#/$defs/featureThreatMatrixItem/properties/controlled_threat_ids/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err247];
}
else {
vErrors.push(err247);
}
errors++;
}
}
}
else {
const err248 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24+"/controlled_threat_ids",schemaPath:"#/$defs/featureThreatMatrixItem/properties/controlled_threat_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err248];
}
else {
vErrors.push(err248);
}
errors++;
}
}
if(data120.insufficient_evidence_threat_ids !== undefined){
let data131 = data120.insufficient_evidence_threat_ids;
if(Array.isArray(data131)){
const len29 = data131.length;
for(let i29=0; i29<len29; i29++){
if(typeof data131[i29] !== "string"){
const err249 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24+"/insufficient_evidence_threat_ids/" + i29,schemaPath:"#/$defs/featureThreatMatrixItem/properties/insufficient_evidence_threat_ids/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err249];
}
else {
vErrors.push(err249);
}
errors++;
}
}
}
else {
const err250 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24+"/insufficient_evidence_threat_ids",schemaPath:"#/$defs/featureThreatMatrixItem/properties/insufficient_evidence_threat_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err250];
}
else {
vErrors.push(err250);
}
errors++;
}
}
if(data120.not_triggered_threat_ids !== undefined){
let data133 = data120.not_triggered_threat_ids;
if(Array.isArray(data133)){
const len30 = data133.length;
for(let i30=0; i30<len30; i30++){
if(typeof data133[i30] !== "string"){
const err251 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24+"/not_triggered_threat_ids/" + i30,schemaPath:"#/$defs/featureThreatMatrixItem/properties/not_triggered_threat_ids/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err251];
}
else {
vErrors.push(err251);
}
errors++;
}
}
}
else {
const err252 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24+"/not_triggered_threat_ids",schemaPath:"#/$defs/featureThreatMatrixItem/properties/not_triggered_threat_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err252];
}
else {
vErrors.push(err252);
}
errors++;
}
}
if(data120.not_applicable_threat_ids !== undefined){
let data135 = data120.not_applicable_threat_ids;
if(Array.isArray(data135)){
const len31 = data135.length;
for(let i31=0; i31<len31; i31++){
if(typeof data135[i31] !== "string"){
const err253 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24+"/not_applicable_threat_ids/" + i31,schemaPath:"#/$defs/featureThreatMatrixItem/properties/not_applicable_threat_ids/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err253];
}
else {
vErrors.push(err253);
}
errors++;
}
}
}
else {
const err254 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24+"/not_applicable_threat_ids",schemaPath:"#/$defs/featureThreatMatrixItem/properties/not_applicable_threat_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err254];
}
else {
vErrors.push(err254);
}
errors++;
}
}
if(data120.document_routes !== undefined){
let data137 = data120.document_routes;
if(Array.isArray(data137)){
const len32 = data137.length;
for(let i32=0; i32<len32; i32++){
if(typeof data137[i32] !== "string"){
const err255 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24+"/document_routes/" + i32,schemaPath:"#/$defs/featureThreatMatrixItem/properties/document_routes/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err255];
}
else {
vErrors.push(err255);
}
errors++;
}
}
}
else {
const err256 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24+"/document_routes",schemaPath:"#/$defs/featureThreatMatrixItem/properties/document_routes/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err256];
}
else {
vErrors.push(err256);
}
errors++;
}
}
if(data120.summary !== undefined){
if(typeof data120.summary !== "string"){
const err257 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24+"/summary",schemaPath:"#/$defs/featureThreatMatrixItem/properties/summary/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err257];
}
else {
vErrors.push(err257);
}
errors++;
}
}
}
else {
const err258 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i24,schemaPath:"#/$defs/featureThreatMatrixItem/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err258];
}
else {
vErrors.push(err258);
}
errors++;
}
}
}
else {
const err259 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix",schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/feature_to_threat_matrix/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err259];
}
else {
vErrors.push(err259);
}
errors++;
}
}
if(data113.document_stack_redline !== undefined){
let data140 = data113.document_stack_redline;
if(Array.isArray(data140)){
const len33 = data140.length;
for(let i33=0; i33<len33; i33++){
let data141 = data140[i33];
if(data141 && typeof data141 == "object" && !Array.isArray(data141)){
}
else {
const err260 = {instancePath:instancePath+"/report_data/full_forensic_record/document_stack_redline/" + i33,schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/document_stack_redline/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err260];
}
else {
vErrors.push(err260);
}
errors++;
}
}
}
else {
const err261 = {instancePath:instancePath+"/report_data/full_forensic_record/document_stack_redline",schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/document_stack_redline/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err261];
}
else {
vErrors.push(err261);
}
errors++;
}
}
if(data113.triggered_findings !== undefined){
let data142 = data113.triggered_findings;
if(Array.isArray(data142)){
const len34 = data142.length;
for(let i34=0; i34<len34; i34++){
if(!(validate35(data142[i34], {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i34,parentData:data142,parentDataProperty:i34,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate35.errors : vErrors.concat(validate35.errors);
errors = vErrors.length;
}
}
}
else {
const err262 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings",schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/triggered_findings/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err262];
}
else {
vErrors.push(err262);
}
errors++;
}
}
if(data113.controlled_rows !== undefined){
let data144 = data113.controlled_rows;
if(Array.isArray(data144)){
const len35 = data144.length;
for(let i35=0; i35<len35; i35++){
let data145 = data144[i35];
if(data145 && typeof data145 == "object" && !Array.isArray(data145)){
if(data145.threat_id === undefined){
const err263 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i35,schemaPath:"#/$defs/controlledRow/required",keyword:"required",params:{missingProperty: "threat_id"},message:"must have required property '"+"threat_id"+"'"};
if(vErrors === null){
vErrors = [err263];
}
else {
vErrors.push(err263);
}
errors++;
}
if(data145.threat_name === undefined){
const err264 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i35,schemaPath:"#/$defs/controlledRow/required",keyword:"required",params:{missingProperty: "threat_name"},message:"must have required property '"+"threat_name"+"'"};
if(vErrors === null){
vErrors = [err264];
}
else {
vErrors.push(err264);
}
errors++;
}
if(data145.status === undefined){
const err265 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i35,schemaPath:"#/$defs/controlledRow/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err265];
}
else {
vErrors.push(err265);
}
errors++;
}
if(data145.linked_feature_ids === undefined){
const err266 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i35,schemaPath:"#/$defs/controlledRow/required",keyword:"required",params:{missingProperty: "linked_feature_ids"},message:"must have required property '"+"linked_feature_ids"+"'"};
if(vErrors === null){
vErrors = [err266];
}
else {
vErrors.push(err266);
}
errors++;
}
if(data145.control_basis === undefined){
const err267 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i35,schemaPath:"#/$defs/controlledRow/required",keyword:"required",params:{missingProperty: "control_basis"},message:"must have required property '"+"control_basis"+"'"};
if(vErrors === null){
vErrors = [err267];
}
else {
vErrors.push(err267);
}
errors++;
}
if(data145.evidence_ref === undefined){
const err268 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i35,schemaPath:"#/$defs/controlledRow/required",keyword:"required",params:{missingProperty: "evidence_ref"},message:"must have required property '"+"evidence_ref"+"'"};
if(vErrors === null){
vErrors = [err268];
}
else {
vErrors.push(err268);
}
errors++;
}
if(data145.reasoning_summary === undefined){
const err269 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i35,schemaPath:"#/$defs/controlledRow/required",keyword:"required",params:{missingProperty: "reasoning_summary"},message:"must have required property '"+"reasoning_summary"+"'"};
if(vErrors === null){
vErrors = [err269];
}
else {
vErrors.push(err269);
}
errors++;
}
if(data145.document_routes === undefined){
const err270 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i35,schemaPath:"#/$defs/controlledRow/required",keyword:"required",params:{missingProperty: "document_routes"},message:"must have required property '"+"document_routes"+"'"};
if(vErrors === null){
vErrors = [err270];
}
else {
vErrors.push(err270);
}
errors++;
}
if(data145.technical_note === undefined){
const err271 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i35,schemaPath:"#/$defs/controlledRow/required",keyword:"required",params:{missingProperty: "technical_note"},message:"must have required property '"+"technical_note"+"'"};
if(vErrors === null){
vErrors = [err271];
}
else {
vErrors.push(err271);
}
errors++;
}
if(data145.threat_id !== undefined){
if(typeof data145.threat_id !== "string"){
const err272 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i35+"/threat_id",schemaPath:"#/$defs/controlledRow/properties/threat_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err272];
}
else {
vErrors.push(err272);
}
errors++;
}
}
if(data145.threat_name !== undefined){
if(typeof data145.threat_name !== "string"){
const err273 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i35+"/threat_name",schemaPath:"#/$defs/controlledRow/properties/threat_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err273];
}
else {
vErrors.push(err273);
}
errors++;
}
}
if(data145.status !== undefined){
if("CONTROLLED" !== data145.status){
const err274 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i35+"/status",schemaPath:"#/$defs/controlledRow/properties/status/const",keyword:"const",params:{allowedValue: "CONTROLLED"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err274];
}
else {
vErrors.push(err274);
}
errors++;
}
}
if(data145.linked_feature_ids !== undefined){
let data149 = data145.linked_feature_ids;
if(Array.isArray(data149)){
const len36 = data149.length;
for(let i36=0; i36<len36; i36++){
if(typeof data149[i36] !== "string"){
const err275 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i35+"/linked_feature_ids/" + i36,schemaPath:"#/$defs/controlledRow/properties/linked_feature_ids/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err275];
}
else {
vErrors.push(err275);
}
errors++;
}
}
}
else {
const err276 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i35+"/linked_feature_ids",schemaPath:"#/$defs/controlledRow/properties/linked_feature_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err276];
}
else {
vErrors.push(err276);
}
errors++;
}
}
if(data145.control_basis !== undefined){
if(typeof data145.control_basis !== "string"){
const err277 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i35+"/control_basis",schemaPath:"#/$defs/controlledRow/properties/control_basis/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err277];
}
else {
vErrors.push(err277);
}
errors++;
}
}
if(data145.evidence_ref !== undefined){
if(typeof data145.evidence_ref !== "string"){
const err278 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i35+"/evidence_ref",schemaPath:"#/$defs/controlledRow/properties/evidence_ref/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err278];
}
else {
vErrors.push(err278);
}
errors++;
}
}
if(data145.reasoning_summary !== undefined){
if(typeof data145.reasoning_summary !== "string"){
const err279 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i35+"/reasoning_summary",schemaPath:"#/$defs/controlledRow/properties/reasoning_summary/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err279];
}
else {
vErrors.push(err279);
}
errors++;
}
}
if(data145.document_routes !== undefined){
let data154 = data145.document_routes;
if(Array.isArray(data154)){
const len37 = data154.length;
for(let i37=0; i37<len37; i37++){
if(typeof data154[i37] !== "string"){
const err280 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i35+"/document_routes/" + i37,schemaPath:"#/$defs/controlledRow/properties/document_routes/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err280];
}
else {
vErrors.push(err280);
}
errors++;
}
}
}
else {
const err281 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i35+"/document_routes",schemaPath:"#/$defs/controlledRow/properties/document_routes/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err281];
}
else {
vErrors.push(err281);
}
errors++;
}
}
if(data145.technical_note !== undefined){
if(typeof data145.technical_note !== "string"){
const err282 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i35+"/technical_note",schemaPath:"#/$defs/controlledRow/properties/technical_note/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err282];
}
else {
vErrors.push(err282);
}
errors++;
}
}
}
else {
const err283 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i35,schemaPath:"#/$defs/controlledRow/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err283];
}
else {
vErrors.push(err283);
}
errors++;
}
}
}
else {
const err284 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows",schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/controlled_rows/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err284];
}
else {
vErrors.push(err284);
}
errors++;
}
}
if(data113.insufficient_evidence_rows !== undefined){
let data157 = data113.insufficient_evidence_rows;
if(Array.isArray(data157)){
const len38 = data157.length;
for(let i38=0; i38<len38; i38++){
let data158 = data157[i38];
if(data158 && typeof data158 == "object" && !Array.isArray(data158)){
if(data158.threat_id === undefined){
const err285 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i38,schemaPath:"#/$defs/insufficientEvidenceRow/required",keyword:"required",params:{missingProperty: "threat_id"},message:"must have required property '"+"threat_id"+"'"};
if(vErrors === null){
vErrors = [err285];
}
else {
vErrors.push(err285);
}
errors++;
}
if(data158.threat_name === undefined){
const err286 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i38,schemaPath:"#/$defs/insufficientEvidenceRow/required",keyword:"required",params:{missingProperty: "threat_name"},message:"must have required property '"+"threat_name"+"'"};
if(vErrors === null){
vErrors = [err286];
}
else {
vErrors.push(err286);
}
errors++;
}
if(data158.status === undefined){
const err287 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i38,schemaPath:"#/$defs/insufficientEvidenceRow/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err287];
}
else {
vErrors.push(err287);
}
errors++;
}
if(data158.linked_feature_ids === undefined){
const err288 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i38,schemaPath:"#/$defs/insufficientEvidenceRow/required",keyword:"required",params:{missingProperty: "linked_feature_ids"},message:"must have required property '"+"linked_feature_ids"+"'"};
if(vErrors === null){
vErrors = [err288];
}
else {
vErrors.push(err288);
}
errors++;
}
if(data158.missing_evidence === undefined){
const err289 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i38,schemaPath:"#/$defs/insufficientEvidenceRow/required",keyword:"required",params:{missingProperty: "missing_evidence"},message:"must have required property '"+"missing_evidence"+"'"};
if(vErrors === null){
vErrors = [err289];
}
else {
vErrors.push(err289);
}
errors++;
}
if(data158.evidence_ref === undefined){
const err290 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i38,schemaPath:"#/$defs/insufficientEvidenceRow/required",keyword:"required",params:{missingProperty: "evidence_ref"},message:"must have required property '"+"evidence_ref"+"'"};
if(vErrors === null){
vErrors = [err290];
}
else {
vErrors.push(err290);
}
errors++;
}
if(data158.reasoning_summary === undefined){
const err291 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i38,schemaPath:"#/$defs/insufficientEvidenceRow/required",keyword:"required",params:{missingProperty: "reasoning_summary"},message:"must have required property '"+"reasoning_summary"+"'"};
if(vErrors === null){
vErrors = [err291];
}
else {
vErrors.push(err291);
}
errors++;
}
if(data158.recommended_follow_up === undefined){
const err292 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i38,schemaPath:"#/$defs/insufficientEvidenceRow/required",keyword:"required",params:{missingProperty: "recommended_follow_up"},message:"must have required property '"+"recommended_follow_up"+"'"};
if(vErrors === null){
vErrors = [err292];
}
else {
vErrors.push(err292);
}
errors++;
}
if(data158.technical_note === undefined){
const err293 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i38,schemaPath:"#/$defs/insufficientEvidenceRow/required",keyword:"required",params:{missingProperty: "technical_note"},message:"must have required property '"+"technical_note"+"'"};
if(vErrors === null){
vErrors = [err293];
}
else {
vErrors.push(err293);
}
errors++;
}
if(data158.threat_id !== undefined){
if(typeof data158.threat_id !== "string"){
const err294 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i38+"/threat_id",schemaPath:"#/$defs/insufficientEvidenceRow/properties/threat_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err294];
}
else {
vErrors.push(err294);
}
errors++;
}
}
if(data158.threat_name !== undefined){
if(typeof data158.threat_name !== "string"){
const err295 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i38+"/threat_name",schemaPath:"#/$defs/insufficientEvidenceRow/properties/threat_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err295];
}
else {
vErrors.push(err295);
}
errors++;
}
}
if(data158.status !== undefined){
if("INSUFFICIENT_EVIDENCE" !== data158.status){
const err296 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i38+"/status",schemaPath:"#/$defs/insufficientEvidenceRow/properties/status/const",keyword:"const",params:{allowedValue: "INSUFFICIENT_EVIDENCE"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err296];
}
else {
vErrors.push(err296);
}
errors++;
}
}
if(data158.linked_feature_ids !== undefined){
let data162 = data158.linked_feature_ids;
if(Array.isArray(data162)){
const len39 = data162.length;
for(let i39=0; i39<len39; i39++){
if(typeof data162[i39] !== "string"){
const err297 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i38+"/linked_feature_ids/" + i39,schemaPath:"#/$defs/insufficientEvidenceRow/properties/linked_feature_ids/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err297];
}
else {
vErrors.push(err297);
}
errors++;
}
}
}
else {
const err298 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i38+"/linked_feature_ids",schemaPath:"#/$defs/insufficientEvidenceRow/properties/linked_feature_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err298];
}
else {
vErrors.push(err298);
}
errors++;
}
}
if(data158.missing_evidence !== undefined){
if(typeof data158.missing_evidence !== "string"){
const err299 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i38+"/missing_evidence",schemaPath:"#/$defs/insufficientEvidenceRow/properties/missing_evidence/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err299];
}
else {
vErrors.push(err299);
}
errors++;
}
}
if(data158.evidence_ref !== undefined){
if(typeof data158.evidence_ref !== "string"){
const err300 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i38+"/evidence_ref",schemaPath:"#/$defs/insufficientEvidenceRow/properties/evidence_ref/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err300];
}
else {
vErrors.push(err300);
}
errors++;
}
}
if(data158.reasoning_summary !== undefined){
if(typeof data158.reasoning_summary !== "string"){
const err301 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i38+"/reasoning_summary",schemaPath:"#/$defs/insufficientEvidenceRow/properties/reasoning_summary/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err301];
}
else {
vErrors.push(err301);
}
errors++;
}
}
if(data158.recommended_follow_up !== undefined){
if(typeof data158.recommended_follow_up !== "string"){
const err302 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i38+"/recommended_follow_up",schemaPath:"#/$defs/insufficientEvidenceRow/properties/recommended_follow_up/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err302];
}
else {
vErrors.push(err302);
}
errors++;
}
}
if(data158.technical_note !== undefined){
if(typeof data158.technical_note !== "string"){
const err303 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i38+"/technical_note",schemaPath:"#/$defs/insufficientEvidenceRow/properties/technical_note/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err303];
}
else {
vErrors.push(err303);
}
errors++;
}
}
}
else {
const err304 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i38,schemaPath:"#/$defs/insufficientEvidenceRow/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err304];
}
else {
vErrors.push(err304);
}
errors++;
}
}
}
else {
const err305 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows",schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/insufficient_evidence_rows/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err305];
}
else {
vErrors.push(err305);
}
errors++;
}
}
if(data113.assembly_route !== undefined){
let data169 = data113.assembly_route;
if(data169 && typeof data169 == "object" && !Array.isArray(data169)){
}
else {
const err306 = {instancePath:instancePath+"/report_data/full_forensic_record/assembly_route",schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/assembly_route/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err306];
}
else {
vErrors.push(err306);
}
errors++;
}
}
if(data113.technical_audit_log !== undefined){
let data170 = data113.technical_audit_log;
if(Array.isArray(data170)){
const len40 = data170.length;
for(let i40=0; i40<len40; i40++){
let data171 = data170[i40];
if(data171 && typeof data171 == "object" && !Array.isArray(data171)){
if(data171.entry_type === undefined){
const err307 = {instancePath:instancePath+"/report_data/full_forensic_record/technical_audit_log/" + i40,schemaPath:"#/$defs/auditEntry/required",keyword:"required",params:{missingProperty: "entry_type"},message:"must have required property '"+"entry_type"+"'"};
if(vErrors === null){
vErrors = [err307];
}
else {
vErrors.push(err307);
}
errors++;
}
if(data171.message === undefined){
const err308 = {instancePath:instancePath+"/report_data/full_forensic_record/technical_audit_log/" + i40,schemaPath:"#/$defs/auditEntry/required",keyword:"required",params:{missingProperty: "message"},message:"must have required property '"+"message"+"'"};
if(vErrors === null){
vErrors = [err308];
}
else {
vErrors.push(err308);
}
errors++;
}
if(data171.severity === undefined){
const err309 = {instancePath:instancePath+"/report_data/full_forensic_record/technical_audit_log/" + i40,schemaPath:"#/$defs/auditEntry/required",keyword:"required",params:{missingProperty: "severity"},message:"must have required property '"+"severity"+"'"};
if(vErrors === null){
vErrors = [err309];
}
else {
vErrors.push(err309);
}
errors++;
}
if(data171.entry_type !== undefined){
if(typeof data171.entry_type !== "string"){
const err310 = {instancePath:instancePath+"/report_data/full_forensic_record/technical_audit_log/" + i40+"/entry_type",schemaPath:"#/$defs/auditEntry/properties/entry_type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err310];
}
else {
vErrors.push(err310);
}
errors++;
}
}
if(data171.threat_id !== undefined){
if(typeof data171.threat_id !== "string"){
const err311 = {instancePath:instancePath+"/report_data/full_forensic_record/technical_audit_log/" + i40+"/threat_id",schemaPath:"#/$defs/auditEntry/properties/threat_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err311];
}
else {
vErrors.push(err311);
}
errors++;
}
}
if(data171.status !== undefined){
if(typeof data171.status !== "string"){
const err312 = {instancePath:instancePath+"/report_data/full_forensic_record/technical_audit_log/" + i40+"/status",schemaPath:"#/$defs/auditEntry/properties/status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err312];
}
else {
vErrors.push(err312);
}
errors++;
}
}
if(data171.message !== undefined){
if(typeof data171.message !== "string"){
const err313 = {instancePath:instancePath+"/report_data/full_forensic_record/technical_audit_log/" + i40+"/message",schemaPath:"#/$defs/auditEntry/properties/message/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err313];
}
else {
vErrors.push(err313);
}
errors++;
}
}
if(data171.source_ref !== undefined){
if(typeof data171.source_ref !== "string"){
const err314 = {instancePath:instancePath+"/report_data/full_forensic_record/technical_audit_log/" + i40+"/source_ref",schemaPath:"#/$defs/auditEntry/properties/source_ref/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err314];
}
else {
vErrors.push(err314);
}
errors++;
}
}
if(data171.severity !== undefined){
let data177 = data171.severity;
if(typeof data177 !== "string"){
const err315 = {instancePath:instancePath+"/report_data/full_forensic_record/technical_audit_log/" + i40+"/severity",schemaPath:"#/$defs/auditEntry/properties/severity/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err315];
}
else {
vErrors.push(err315);
}
errors++;
}
if(!(((data177 === "INFO") || (data177 === "WARNING")) || (data177 === "ERROR"))){
const err316 = {instancePath:instancePath+"/report_data/full_forensic_record/technical_audit_log/" + i40+"/severity",schemaPath:"#/$defs/auditEntry/properties/severity/enum",keyword:"enum",params:{allowedValues: schema61.properties.severity.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err316];
}
else {
vErrors.push(err316);
}
errors++;
}
}
}
else {
const err317 = {instancePath:instancePath+"/report_data/full_forensic_record/technical_audit_log/" + i40,schemaPath:"#/$defs/auditEntry/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err317];
}
else {
vErrors.push(err317);
}
errors++;
}
}
}
else {
const err318 = {instancePath:instancePath+"/report_data/full_forensic_record/technical_audit_log",schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/technical_audit_log/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err318];
}
else {
vErrors.push(err318);
}
errors++;
}
}
}
else {
const err319 = {instancePath:instancePath+"/report_data/full_forensic_record",schemaPath:"#/properties/report_data/properties/full_forensic_record/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err319];
}
else {
vErrors.push(err319);
}
errors++;
}
}
}
else {
const err320 = {instancePath:instancePath+"/report_data",schemaPath:"#/properties/report_data/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err320];
}
else {
vErrors.push(err320);
}
errors++;
}
}
if(data.technical_audit_log !== undefined){
let data178 = data.technical_audit_log;
if(Array.isArray(data178)){
const len41 = data178.length;
for(let i41=0; i41<len41; i41++){
let data179 = data178[i41];
if(data179 && typeof data179 == "object" && !Array.isArray(data179)){
if(data179.entry_type === undefined){
const err321 = {instancePath:instancePath+"/technical_audit_log/" + i41,schemaPath:"#/$defs/auditEntry/required",keyword:"required",params:{missingProperty: "entry_type"},message:"must have required property '"+"entry_type"+"'"};
if(vErrors === null){
vErrors = [err321];
}
else {
vErrors.push(err321);
}
errors++;
}
if(data179.message === undefined){
const err322 = {instancePath:instancePath+"/technical_audit_log/" + i41,schemaPath:"#/$defs/auditEntry/required",keyword:"required",params:{missingProperty: "message"},message:"must have required property '"+"message"+"'"};
if(vErrors === null){
vErrors = [err322];
}
else {
vErrors.push(err322);
}
errors++;
}
if(data179.severity === undefined){
const err323 = {instancePath:instancePath+"/technical_audit_log/" + i41,schemaPath:"#/$defs/auditEntry/required",keyword:"required",params:{missingProperty: "severity"},message:"must have required property '"+"severity"+"'"};
if(vErrors === null){
vErrors = [err323];
}
else {
vErrors.push(err323);
}
errors++;
}
if(data179.entry_type !== undefined){
if(typeof data179.entry_type !== "string"){
const err324 = {instancePath:instancePath+"/technical_audit_log/" + i41+"/entry_type",schemaPath:"#/$defs/auditEntry/properties/entry_type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err324];
}
else {
vErrors.push(err324);
}
errors++;
}
}
if(data179.threat_id !== undefined){
if(typeof data179.threat_id !== "string"){
const err325 = {instancePath:instancePath+"/technical_audit_log/" + i41+"/threat_id",schemaPath:"#/$defs/auditEntry/properties/threat_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err325];
}
else {
vErrors.push(err325);
}
errors++;
}
}
if(data179.status !== undefined){
if(typeof data179.status !== "string"){
const err326 = {instancePath:instancePath+"/technical_audit_log/" + i41+"/status",schemaPath:"#/$defs/auditEntry/properties/status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err326];
}
else {
vErrors.push(err326);
}
errors++;
}
}
if(data179.message !== undefined){
if(typeof data179.message !== "string"){
const err327 = {instancePath:instancePath+"/technical_audit_log/" + i41+"/message",schemaPath:"#/$defs/auditEntry/properties/message/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err327];
}
else {
vErrors.push(err327);
}
errors++;
}
}
if(data179.source_ref !== undefined){
if(typeof data179.source_ref !== "string"){
const err328 = {instancePath:instancePath+"/technical_audit_log/" + i41+"/source_ref",schemaPath:"#/$defs/auditEntry/properties/source_ref/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err328];
}
else {
vErrors.push(err328);
}
errors++;
}
}
if(data179.severity !== undefined){
let data185 = data179.severity;
if(typeof data185 !== "string"){
const err329 = {instancePath:instancePath+"/technical_audit_log/" + i41+"/severity",schemaPath:"#/$defs/auditEntry/properties/severity/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err329];
}
else {
vErrors.push(err329);
}
errors++;
}
if(!(((data185 === "INFO") || (data185 === "WARNING")) || (data185 === "ERROR"))){
const err330 = {instancePath:instancePath+"/technical_audit_log/" + i41+"/severity",schemaPath:"#/$defs/auditEntry/properties/severity/enum",keyword:"enum",params:{allowedValues: schema61.properties.severity.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err330];
}
else {
vErrors.push(err330);
}
errors++;
}
}
}
else {
const err331 = {instancePath:instancePath+"/technical_audit_log/" + i41,schemaPath:"#/$defs/auditEntry/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err331];
}
else {
vErrors.push(err331);
}
errors++;
}
}
}
else {
const err332 = {instancePath:instancePath+"/technical_audit_log",schemaPath:"#/properties/technical_audit_log/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err332];
}
else {
vErrors.push(err332);
}
errors++;
}
}
if(data.threat_findings !== undefined){
let data186 = data.threat_findings;
if(Array.isArray(data186)){
const len42 = data186.length;
for(let i42=0; i42<len42; i42++){
if(!(validate38(data186[i42], {instancePath:instancePath+"/threat_findings/" + i42,parentData:data186,parentDataProperty:i42,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate38.errors : vErrors.concat(validate38.errors);
errors = vErrors.length;
}
}
}
else {
const err333 = {instancePath:instancePath+"/threat_findings",schemaPath:"#/properties/threat_findings/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err333];
}
else {
vErrors.push(err333);
}
errors++;
}
}
if(data.vault_confirmation_questions !== undefined){
let data188 = data.vault_confirmation_questions;
if(Array.isArray(data188)){
const len43 = data188.length;
for(let i43=0; i43<len43; i43++){
if(!(validate40(data188[i43], {instancePath:instancePath+"/vault_confirmation_questions/" + i43,parentData:data188,parentDataProperty:i43,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate40.errors : vErrors.concat(validate40.errors);
errors = vErrors.length;
}
}
}
else {
const err334 = {instancePath:instancePath+"/vault_confirmation_questions",schemaPath:"#/properties/vault_confirmation_questions/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err334];
}
else {
vErrors.push(err334);
}
errors++;
}
}
if(data.disclaimer !== undefined){
let data190 = data.disclaimer;
if(typeof data190 !== "string"){
const err335 = {instancePath:instancePath+"/disclaimer",schemaPath:"#/properties/disclaimer/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err335];
}
else {
vErrors.push(err335);
}
errors++;
}
if("Public demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use." !== data190){
const err336 = {instancePath:instancePath+"/disclaimer",schemaPath:"#/properties/disclaimer/const",keyword:"const",params:{allowedValue: "Public demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use."},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err336];
}
else {
vErrors.push(err336);
}
errors++;
}
}
}
else {
const err337 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err337];
}
else {
vErrors.push(err337);
}
errors++;
}
validate34.errors = vErrors;
return errors === 0;
}
validate34.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

export const validate_diligenceReport = validate42;
const schema67 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://interface-sandbox.local/schemas/diligenceReport.schema.json","title":"Diligence Compiler Output","description":"Canonical diligence_compiler_output. No array cap is imposed on findings, controlled rows, insufficient-evidence rows, or product features. Counts must match registry status totals at validation time.","type":"object","required":["diligence_run","source_bundle_summary","target_profile","primary_product","product_feature_map","legal_stack","document_stack_redline","threat_registry_summary","feature_to_threat_matrix","findings","controlled_rows","insufficient_evidence_rows","report_data","technical_audit_log","assembly_route","assembly_handoff","handoff_envelope","disclaimer"],"additionalProperties":false,"properties":{"diligence_run":{"type":"object","required":["run_id","created_at","source_mode"],"additionalProperties":true,"properties":{"run_id":{"type":"string"},"created_at":{"type":"string","format":"date-time"},"source_mode":{"type":"string","enum":["url","manual_urls","text","url_plus_text"]}}},"source_bundle_summary":{"type":"object","additionalProperties":true},"target_profile":{"type":"object","additionalProperties":true},"primary_product":{"type":"object","additionalProperties":true},"product_feature_map":{"type":"array","items":{"type":"object","additionalProperties":true}},"legal_stack":{"type":"array","items":{"type":"object","additionalProperties":true}},"document_stack_redline":{"type":"array","items":{"type":"object","additionalProperties":true}},"threat_registry_summary":{"type":"object","required":["registry_count_loaded","count_by_status"],"additionalProperties":true,"properties":{"registry_count_loaded":{"type":"integer","minimum":0},"count_by_status":{"type":"object","additionalProperties":{"type":"integer","minimum":0}}}},"feature_to_threat_matrix":{"type":"array","items":{"type":"object","additionalProperties":true}},"findings":{"type":"array","description":"Must equal count(TRIGGERED).","items":{"$ref":"#/$defs/finding"}},"controlled_rows":{"type":"array","description":"Must equal count(CONTROLLED).","items":{"$ref":"#/$defs/statusRow"}},"insufficient_evidence_rows":{"type":"array","description":"Must equal count(INSUFFICIENT_EVIDENCE).","items":{"$ref":"#/$defs/statusRow"}},"report_data":{"type":"object","required":["executive_report","full_forensic_record"],"additionalProperties":false,"properties":{"executive_report":{"type":"object","required":["cover_reliance","scope_methodology","subject_profile","risk_posture_summary","material_findings_highlights","triggered_findings_schedule","document_stack_verdict","recommended_route"],"additionalProperties":false,"properties":{"cover_reliance":{"type":"object","additionalProperties":true},"scope_methodology":{"type":"object","additionalProperties":true},"subject_profile":{"type":"object","additionalProperties":true},"risk_posture_summary":{"type":"object","additionalProperties":true},"material_findings_highlights":{"type":"array","items":{"type":"object","additionalProperties":true}},"triggered_findings_schedule":{"type":"array","items":{"type":"object","required":["threat_id","threat_name","pain_category","archetype","linked_feature","document_route","short_issue"],"additionalProperties":false,"properties":{"threat_id":{"type":"string"},"threat_name":{"type":"string"},"pain_category":{"type":"string"},"archetype":{"type":"string"},"linked_feature":{"type":"string"},"document_route":{"type":"string"},"short_issue":{"type":"string"}}}},"document_stack_verdict":{"type":"object","additionalProperties":true},"recommended_route":{"type":"object","additionalProperties":true}}},"full_forensic_record":{"type":"object","required":["source_review","product_feature_map","feature_to_threat_matrix","document_stack_redline","triggered_findings","controlled_rows","insufficient_evidence_rows","assembly_route","technical_audit_log"],"additionalProperties":false,"properties":{"source_review":{"type":"object","additionalProperties":true},"product_feature_map":{"type":"array","items":{"type":"object","additionalProperties":true}},"feature_to_threat_matrix":{"type":"array","items":{"type":"object","additionalProperties":true}},"document_stack_redline":{"type":"array","items":{"type":"object","additionalProperties":true}},"triggered_findings":{"type":"array","items":{"$ref":"#/$defs/finding"}},"controlled_rows":{"type":"array","items":{"$ref":"#/$defs/statusRow"}},"insufficient_evidence_rows":{"type":"array","items":{"$ref":"#/$defs/statusRow"}},"assembly_route":{"type":"object","additionalProperties":true},"technical_audit_log":{"type":"array","items":{"type":"object","additionalProperties":true}}}}}},"technical_audit_log":{"type":"array","items":{"type":"object","additionalProperties":true}},"assembly_route":{"type":"object","additionalProperties":true},"assembly_handoff":{"type":"object","additionalProperties":true},"handoff_envelope":{"type":"object","additionalProperties":true},"disclaimer":{"type":"string"}},"$defs":{"finding":{"type":"object","required":["finding_id","threat_id","threat_name","status","pain_tier","pain_category","pain_depth","lane","archetype","surface_tokens","subcat","authority","linked_feature_ids","evidence","trigger_evaluation","registry_payload","redline_route","document_routes","vault_dependencies","finding_memo_note"],"additionalProperties":false,"properties":{"finding_id":{"type":"string"},"threat_id":{"type":"string"},"threat_name":{"type":"string"},"status":{"const":"TRIGGERED"},"pain_tier":{"type":"string"},"pain_category":{"type":"string"},"pain_depth":{"type":"string"},"lane":{"type":"string"},"archetype":{"type":"string"},"surface_tokens":{"type":"array","items":{"type":"string"}},"subcat":{"type":"string"},"authority":{"type":"string"},"linked_feature_ids":{"type":"array","items":{"type":"string"}},"evidence":{"type":"object","required":["source_url","artifact_class","proof_citation","evidence_mode","source_hash","extracted_excerpt"],"additionalProperties":false,"properties":{"source_url":{"type":"string"},"artifact_class":{"type":"string"},"proof_citation":{"type":"string"},"evidence_mode":{"type":"string"},"source_hash":{"type":"string"},"extracted_excerpt":{"type":"string"}}},"trigger_evaluation":{"type":"object","required":["conditions_passed","conditions_failed","trigger_if_result","exclude_if_result","exclude_if_basis"],"additionalProperties":false,"properties":{"conditions_passed":{"type":"array","items":{"type":"string"}},"conditions_failed":{"type":"array","items":{"type":"string"}},"trigger_if_result":{"type":"boolean"},"exclude_if_result":{"type":"boolean"},"exclude_if_basis":{"type":"string"}}},"registry_payload":{"type":"object","required":["legal_pain","fp_mechanism","fp_impact","lex_nova_fix"],"additionalProperties":false,"properties":{"legal_pain":{"type":"string"},"fp_mechanism":{"type":"string"},"fp_impact":{"type":"string"},"lex_nova_fix":{"type":"string"}}},"redline_route":{"type":"array","items":{"type":"string"}},"document_routes":{"type":"array","items":{"type":"string"}},"vault_dependencies":{"type":"array","items":{"type":"string"}},"finding_memo_note":{"type":"string"}}},"statusRow":{"type":"object","required":["threat_id","threat_name","status","reasoning_summary"],"additionalProperties":true,"properties":{"threat_id":{"type":"string"},"threat_name":{"type":"string"},"status":{"type":"string","enum":["CONTROLLED","INSUFFICIENT_EVIDENCE"]},"reasoning_summary":{"type":"string"}}}}};
const schema68 = {"type":"object","required":["finding_id","threat_id","threat_name","status","pain_tier","pain_category","pain_depth","lane","archetype","surface_tokens","subcat","authority","linked_feature_ids","evidence","trigger_evaluation","registry_payload","redline_route","document_routes","vault_dependencies","finding_memo_note"],"additionalProperties":false,"properties":{"finding_id":{"type":"string"},"threat_id":{"type":"string"},"threat_name":{"type":"string"},"status":{"const":"TRIGGERED"},"pain_tier":{"type":"string"},"pain_category":{"type":"string"},"pain_depth":{"type":"string"},"lane":{"type":"string"},"archetype":{"type":"string"},"surface_tokens":{"type":"array","items":{"type":"string"}},"subcat":{"type":"string"},"authority":{"type":"string"},"linked_feature_ids":{"type":"array","items":{"type":"string"}},"evidence":{"type":"object","required":["source_url","artifact_class","proof_citation","evidence_mode","source_hash","extracted_excerpt"],"additionalProperties":false,"properties":{"source_url":{"type":"string"},"artifact_class":{"type":"string"},"proof_citation":{"type":"string"},"evidence_mode":{"type":"string"},"source_hash":{"type":"string"},"extracted_excerpt":{"type":"string"}}},"trigger_evaluation":{"type":"object","required":["conditions_passed","conditions_failed","trigger_if_result","exclude_if_result","exclude_if_basis"],"additionalProperties":false,"properties":{"conditions_passed":{"type":"array","items":{"type":"string"}},"conditions_failed":{"type":"array","items":{"type":"string"}},"trigger_if_result":{"type":"boolean"},"exclude_if_result":{"type":"boolean"},"exclude_if_basis":{"type":"string"}}},"registry_payload":{"type":"object","required":["legal_pain","fp_mechanism","fp_impact","lex_nova_fix"],"additionalProperties":false,"properties":{"legal_pain":{"type":"string"},"fp_mechanism":{"type":"string"},"fp_impact":{"type":"string"},"lex_nova_fix":{"type":"string"}}},"redline_route":{"type":"array","items":{"type":"string"}},"document_routes":{"type":"array","items":{"type":"string"}},"vault_dependencies":{"type":"array","items":{"type":"string"}},"finding_memo_note":{"type":"string"}}};
const schema69 = {"type":"object","required":["threat_id","threat_name","status","reasoning_summary"],"additionalProperties":true,"properties":{"threat_id":{"type":"string"},"threat_name":{"type":"string"},"status":{"type":"string","enum":["CONTROLLED","INSUFFICIENT_EVIDENCE"]},"reasoning_summary":{"type":"string"}}};

function validate42(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://interface-sandbox.local/schemas/diligenceReport.schema.json" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate42.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.diligence_run === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "diligence_run"},message:"must have required property '"+"diligence_run"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.source_bundle_summary === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_bundle_summary"},message:"must have required property '"+"source_bundle_summary"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.target_profile === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "target_profile"},message:"must have required property '"+"target_profile"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.primary_product === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "primary_product"},message:"must have required property '"+"primary_product"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.product_feature_map === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "product_feature_map"},message:"must have required property '"+"product_feature_map"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.legal_stack === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "legal_stack"},message:"must have required property '"+"legal_stack"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.document_stack_redline === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "document_stack_redline"},message:"must have required property '"+"document_stack_redline"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.threat_registry_summary === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "threat_registry_summary"},message:"must have required property '"+"threat_registry_summary"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.feature_to_threat_matrix === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "feature_to_threat_matrix"},message:"must have required property '"+"feature_to_threat_matrix"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.findings === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "findings"},message:"must have required property '"+"findings"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.controlled_rows === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "controlled_rows"},message:"must have required property '"+"controlled_rows"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.insufficient_evidence_rows === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "insufficient_evidence_rows"},message:"must have required property '"+"insufficient_evidence_rows"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.report_data === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "report_data"},message:"must have required property '"+"report_data"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.technical_audit_log === undefined){
const err13 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "technical_audit_log"},message:"must have required property '"+"technical_audit_log"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data.assembly_route === undefined){
const err14 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "assembly_route"},message:"must have required property '"+"assembly_route"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data.assembly_handoff === undefined){
const err15 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "assembly_handoff"},message:"must have required property '"+"assembly_handoff"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data.handoff_envelope === undefined){
const err16 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "handoff_envelope"},message:"must have required property '"+"handoff_envelope"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data.disclaimer === undefined){
const err17 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "disclaimer"},message:"must have required property '"+"disclaimer"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema67.properties, key0))){
const err18 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.diligence_run !== undefined){
let data0 = data.diligence_run;
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
if(data0.run_id === undefined){
const err19 = {instancePath:instancePath+"/diligence_run",schemaPath:"#/properties/diligence_run/required",keyword:"required",params:{missingProperty: "run_id"},message:"must have required property '"+"run_id"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data0.created_at === undefined){
const err20 = {instancePath:instancePath+"/diligence_run",schemaPath:"#/properties/diligence_run/required",keyword:"required",params:{missingProperty: "created_at"},message:"must have required property '"+"created_at"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data0.source_mode === undefined){
const err21 = {instancePath:instancePath+"/diligence_run",schemaPath:"#/properties/diligence_run/required",keyword:"required",params:{missingProperty: "source_mode"},message:"must have required property '"+"source_mode"+"'"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data0.run_id !== undefined){
if(typeof data0.run_id !== "string"){
const err22 = {instancePath:instancePath+"/diligence_run/run_id",schemaPath:"#/properties/diligence_run/properties/run_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data0.created_at !== undefined){
if(!(typeof data0.created_at === "string")){
const err23 = {instancePath:instancePath+"/diligence_run/created_at",schemaPath:"#/properties/diligence_run/properties/created_at/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data0.source_mode !== undefined){
let data3 = data0.source_mode;
if(typeof data3 !== "string"){
const err24 = {instancePath:instancePath+"/diligence_run/source_mode",schemaPath:"#/properties/diligence_run/properties/source_mode/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(!((((data3 === "url") || (data3 === "manual_urls")) || (data3 === "text")) || (data3 === "url_plus_text"))){
const err25 = {instancePath:instancePath+"/diligence_run/source_mode",schemaPath:"#/properties/diligence_run/properties/source_mode/enum",keyword:"enum",params:{allowedValues: schema67.properties.diligence_run.properties.source_mode.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
}
else {
const err26 = {instancePath:instancePath+"/diligence_run",schemaPath:"#/properties/diligence_run/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data.source_bundle_summary !== undefined){
let data4 = data.source_bundle_summary;
if(data4 && typeof data4 == "object" && !Array.isArray(data4)){
}
else {
const err27 = {instancePath:instancePath+"/source_bundle_summary",schemaPath:"#/properties/source_bundle_summary/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.target_profile !== undefined){
let data5 = data.target_profile;
if(data5 && typeof data5 == "object" && !Array.isArray(data5)){
}
else {
const err28 = {instancePath:instancePath+"/target_profile",schemaPath:"#/properties/target_profile/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data.primary_product !== undefined){
let data6 = data.primary_product;
if(data6 && typeof data6 == "object" && !Array.isArray(data6)){
}
else {
const err29 = {instancePath:instancePath+"/primary_product",schemaPath:"#/properties/primary_product/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data.product_feature_map !== undefined){
let data7 = data.product_feature_map;
if(Array.isArray(data7)){
const len0 = data7.length;
for(let i0=0; i0<len0; i0++){
let data8 = data7[i0];
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
}
else {
const err30 = {instancePath:instancePath+"/product_feature_map/" + i0,schemaPath:"#/properties/product_feature_map/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
}
else {
const err31 = {instancePath:instancePath+"/product_feature_map",schemaPath:"#/properties/product_feature_map/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data.legal_stack !== undefined){
let data9 = data.legal_stack;
if(Array.isArray(data9)){
const len1 = data9.length;
for(let i1=0; i1<len1; i1++){
let data10 = data9[i1];
if(data10 && typeof data10 == "object" && !Array.isArray(data10)){
}
else {
const err32 = {instancePath:instancePath+"/legal_stack/" + i1,schemaPath:"#/properties/legal_stack/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
}
else {
const err33 = {instancePath:instancePath+"/legal_stack",schemaPath:"#/properties/legal_stack/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data.document_stack_redline !== undefined){
let data11 = data.document_stack_redline;
if(Array.isArray(data11)){
const len2 = data11.length;
for(let i2=0; i2<len2; i2++){
let data12 = data11[i2];
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
}
else {
const err34 = {instancePath:instancePath+"/document_stack_redline/" + i2,schemaPath:"#/properties/document_stack_redline/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
}
else {
const err35 = {instancePath:instancePath+"/document_stack_redline",schemaPath:"#/properties/document_stack_redline/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data.threat_registry_summary !== undefined){
let data13 = data.threat_registry_summary;
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(data13.registry_count_loaded === undefined){
const err36 = {instancePath:instancePath+"/threat_registry_summary",schemaPath:"#/properties/threat_registry_summary/required",keyword:"required",params:{missingProperty: "registry_count_loaded"},message:"must have required property '"+"registry_count_loaded"+"'"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(data13.count_by_status === undefined){
const err37 = {instancePath:instancePath+"/threat_registry_summary",schemaPath:"#/properties/threat_registry_summary/required",keyword:"required",params:{missingProperty: "count_by_status"},message:"must have required property '"+"count_by_status"+"'"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(data13.registry_count_loaded !== undefined){
let data14 = data13.registry_count_loaded;
if(!((typeof data14 == "number") && (!(data14 % 1) && !isNaN(data14)))){
const err38 = {instancePath:instancePath+"/threat_registry_summary/registry_count_loaded",schemaPath:"#/properties/threat_registry_summary/properties/registry_count_loaded/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(typeof data14 == "number"){
if(data14 < 0 || isNaN(data14)){
const err39 = {instancePath:instancePath+"/threat_registry_summary/registry_count_loaded",schemaPath:"#/properties/threat_registry_summary/properties/registry_count_loaded/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
}
if(data13.count_by_status !== undefined){
let data15 = data13.count_by_status;
if(data15 && typeof data15 == "object" && !Array.isArray(data15)){
for(const key1 in data15){
let data16 = data15[key1];
if(!((typeof data16 == "number") && (!(data16 % 1) && !isNaN(data16)))){
const err40 = {instancePath:instancePath+"/threat_registry_summary/count_by_status/" + key1.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/properties/threat_registry_summary/properties/count_by_status/additionalProperties/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(typeof data16 == "number"){
if(data16 < 0 || isNaN(data16)){
const err41 = {instancePath:instancePath+"/threat_registry_summary/count_by_status/" + key1.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/properties/threat_registry_summary/properties/count_by_status/additionalProperties/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
}
}
else {
const err42 = {instancePath:instancePath+"/threat_registry_summary/count_by_status",schemaPath:"#/properties/threat_registry_summary/properties/count_by_status/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
}
else {
const err43 = {instancePath:instancePath+"/threat_registry_summary",schemaPath:"#/properties/threat_registry_summary/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
if(data.feature_to_threat_matrix !== undefined){
let data17 = data.feature_to_threat_matrix;
if(Array.isArray(data17)){
const len3 = data17.length;
for(let i3=0; i3<len3; i3++){
let data18 = data17[i3];
if(data18 && typeof data18 == "object" && !Array.isArray(data18)){
}
else {
const err44 = {instancePath:instancePath+"/feature_to_threat_matrix/" + i3,schemaPath:"#/properties/feature_to_threat_matrix/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
}
else {
const err45 = {instancePath:instancePath+"/feature_to_threat_matrix",schemaPath:"#/properties/feature_to_threat_matrix/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(data.findings !== undefined){
let data19 = data.findings;
if(Array.isArray(data19)){
const len4 = data19.length;
for(let i4=0; i4<len4; i4++){
let data20 = data19[i4];
if(data20 && typeof data20 == "object" && !Array.isArray(data20)){
if(data20.finding_id === undefined){
const err46 = {instancePath:instancePath+"/findings/" + i4,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "finding_id"},message:"must have required property '"+"finding_id"+"'"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
if(data20.threat_id === undefined){
const err47 = {instancePath:instancePath+"/findings/" + i4,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "threat_id"},message:"must have required property '"+"threat_id"+"'"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(data20.threat_name === undefined){
const err48 = {instancePath:instancePath+"/findings/" + i4,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "threat_name"},message:"must have required property '"+"threat_name"+"'"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(data20.status === undefined){
const err49 = {instancePath:instancePath+"/findings/" + i4,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if(data20.pain_tier === undefined){
const err50 = {instancePath:instancePath+"/findings/" + i4,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "pain_tier"},message:"must have required property '"+"pain_tier"+"'"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if(data20.pain_category === undefined){
const err51 = {instancePath:instancePath+"/findings/" + i4,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "pain_category"},message:"must have required property '"+"pain_category"+"'"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if(data20.pain_depth === undefined){
const err52 = {instancePath:instancePath+"/findings/" + i4,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "pain_depth"},message:"must have required property '"+"pain_depth"+"'"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
if(data20.lane === undefined){
const err53 = {instancePath:instancePath+"/findings/" + i4,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "lane"},message:"must have required property '"+"lane"+"'"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(data20.archetype === undefined){
const err54 = {instancePath:instancePath+"/findings/" + i4,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "archetype"},message:"must have required property '"+"archetype"+"'"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
if(data20.surface_tokens === undefined){
const err55 = {instancePath:instancePath+"/findings/" + i4,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "surface_tokens"},message:"must have required property '"+"surface_tokens"+"'"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
if(data20.subcat === undefined){
const err56 = {instancePath:instancePath+"/findings/" + i4,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "subcat"},message:"must have required property '"+"subcat"+"'"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
if(data20.authority === undefined){
const err57 = {instancePath:instancePath+"/findings/" + i4,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "authority"},message:"must have required property '"+"authority"+"'"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(data20.linked_feature_ids === undefined){
const err58 = {instancePath:instancePath+"/findings/" + i4,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "linked_feature_ids"},message:"must have required property '"+"linked_feature_ids"+"'"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
if(data20.evidence === undefined){
const err59 = {instancePath:instancePath+"/findings/" + i4,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "evidence"},message:"must have required property '"+"evidence"+"'"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(data20.trigger_evaluation === undefined){
const err60 = {instancePath:instancePath+"/findings/" + i4,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "trigger_evaluation"},message:"must have required property '"+"trigger_evaluation"+"'"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
if(data20.registry_payload === undefined){
const err61 = {instancePath:instancePath+"/findings/" + i4,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "registry_payload"},message:"must have required property '"+"registry_payload"+"'"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if(data20.redline_route === undefined){
const err62 = {instancePath:instancePath+"/findings/" + i4,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "redline_route"},message:"must have required property '"+"redline_route"+"'"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
if(data20.document_routes === undefined){
const err63 = {instancePath:instancePath+"/findings/" + i4,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "document_routes"},message:"must have required property '"+"document_routes"+"'"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
if(data20.vault_dependencies === undefined){
const err64 = {instancePath:instancePath+"/findings/" + i4,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "vault_dependencies"},message:"must have required property '"+"vault_dependencies"+"'"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
if(data20.finding_memo_note === undefined){
const err65 = {instancePath:instancePath+"/findings/" + i4,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "finding_memo_note"},message:"must have required property '"+"finding_memo_note"+"'"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
for(const key2 in data20){
if(!(func1.call(schema68.properties, key2))){
const err66 = {instancePath:instancePath+"/findings/" + i4,schemaPath:"#/$defs/finding/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
if(data20.finding_id !== undefined){
if(typeof data20.finding_id !== "string"){
const err67 = {instancePath:instancePath+"/findings/" + i4+"/finding_id",schemaPath:"#/$defs/finding/properties/finding_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
}
if(data20.threat_id !== undefined){
if(typeof data20.threat_id !== "string"){
const err68 = {instancePath:instancePath+"/findings/" + i4+"/threat_id",schemaPath:"#/$defs/finding/properties/threat_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
}
if(data20.threat_name !== undefined){
if(typeof data20.threat_name !== "string"){
const err69 = {instancePath:instancePath+"/findings/" + i4+"/threat_name",schemaPath:"#/$defs/finding/properties/threat_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
}
if(data20.status !== undefined){
if("TRIGGERED" !== data20.status){
const err70 = {instancePath:instancePath+"/findings/" + i4+"/status",schemaPath:"#/$defs/finding/properties/status/const",keyword:"const",params:{allowedValue: "TRIGGERED"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
}
if(data20.pain_tier !== undefined){
if(typeof data20.pain_tier !== "string"){
const err71 = {instancePath:instancePath+"/findings/" + i4+"/pain_tier",schemaPath:"#/$defs/finding/properties/pain_tier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
}
if(data20.pain_category !== undefined){
if(typeof data20.pain_category !== "string"){
const err72 = {instancePath:instancePath+"/findings/" + i4+"/pain_category",schemaPath:"#/$defs/finding/properties/pain_category/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
}
if(data20.pain_depth !== undefined){
if(typeof data20.pain_depth !== "string"){
const err73 = {instancePath:instancePath+"/findings/" + i4+"/pain_depth",schemaPath:"#/$defs/finding/properties/pain_depth/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
}
if(data20.lane !== undefined){
if(typeof data20.lane !== "string"){
const err74 = {instancePath:instancePath+"/findings/" + i4+"/lane",schemaPath:"#/$defs/finding/properties/lane/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
}
if(data20.archetype !== undefined){
if(typeof data20.archetype !== "string"){
const err75 = {instancePath:instancePath+"/findings/" + i4+"/archetype",schemaPath:"#/$defs/finding/properties/archetype/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
}
if(data20.surface_tokens !== undefined){
let data30 = data20.surface_tokens;
if(Array.isArray(data30)){
const len5 = data30.length;
for(let i5=0; i5<len5; i5++){
if(typeof data30[i5] !== "string"){
const err76 = {instancePath:instancePath+"/findings/" + i4+"/surface_tokens/" + i5,schemaPath:"#/$defs/finding/properties/surface_tokens/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
}
}
else {
const err77 = {instancePath:instancePath+"/findings/" + i4+"/surface_tokens",schemaPath:"#/$defs/finding/properties/surface_tokens/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
}
if(data20.subcat !== undefined){
if(typeof data20.subcat !== "string"){
const err78 = {instancePath:instancePath+"/findings/" + i4+"/subcat",schemaPath:"#/$defs/finding/properties/subcat/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
if(data20.authority !== undefined){
if(typeof data20.authority !== "string"){
const err79 = {instancePath:instancePath+"/findings/" + i4+"/authority",schemaPath:"#/$defs/finding/properties/authority/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
}
if(data20.linked_feature_ids !== undefined){
let data34 = data20.linked_feature_ids;
if(Array.isArray(data34)){
const len6 = data34.length;
for(let i6=0; i6<len6; i6++){
if(typeof data34[i6] !== "string"){
const err80 = {instancePath:instancePath+"/findings/" + i4+"/linked_feature_ids/" + i6,schemaPath:"#/$defs/finding/properties/linked_feature_ids/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
}
}
else {
const err81 = {instancePath:instancePath+"/findings/" + i4+"/linked_feature_ids",schemaPath:"#/$defs/finding/properties/linked_feature_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
}
if(data20.evidence !== undefined){
let data36 = data20.evidence;
if(data36 && typeof data36 == "object" && !Array.isArray(data36)){
if(data36.source_url === undefined){
const err82 = {instancePath:instancePath+"/findings/" + i4+"/evidence",schemaPath:"#/$defs/finding/properties/evidence/required",keyword:"required",params:{missingProperty: "source_url"},message:"must have required property '"+"source_url"+"'"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
if(data36.artifact_class === undefined){
const err83 = {instancePath:instancePath+"/findings/" + i4+"/evidence",schemaPath:"#/$defs/finding/properties/evidence/required",keyword:"required",params:{missingProperty: "artifact_class"},message:"must have required property '"+"artifact_class"+"'"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
if(data36.proof_citation === undefined){
const err84 = {instancePath:instancePath+"/findings/" + i4+"/evidence",schemaPath:"#/$defs/finding/properties/evidence/required",keyword:"required",params:{missingProperty: "proof_citation"},message:"must have required property '"+"proof_citation"+"'"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
if(data36.evidence_mode === undefined){
const err85 = {instancePath:instancePath+"/findings/" + i4+"/evidence",schemaPath:"#/$defs/finding/properties/evidence/required",keyword:"required",params:{missingProperty: "evidence_mode"},message:"must have required property '"+"evidence_mode"+"'"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
if(data36.source_hash === undefined){
const err86 = {instancePath:instancePath+"/findings/" + i4+"/evidence",schemaPath:"#/$defs/finding/properties/evidence/required",keyword:"required",params:{missingProperty: "source_hash"},message:"must have required property '"+"source_hash"+"'"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
if(data36.extracted_excerpt === undefined){
const err87 = {instancePath:instancePath+"/findings/" + i4+"/evidence",schemaPath:"#/$defs/finding/properties/evidence/required",keyword:"required",params:{missingProperty: "extracted_excerpt"},message:"must have required property '"+"extracted_excerpt"+"'"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
for(const key3 in data36){
if(!((((((key3 === "source_url") || (key3 === "artifact_class")) || (key3 === "proof_citation")) || (key3 === "evidence_mode")) || (key3 === "source_hash")) || (key3 === "extracted_excerpt"))){
const err88 = {instancePath:instancePath+"/findings/" + i4+"/evidence",schemaPath:"#/$defs/finding/properties/evidence/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
}
if(data36.source_url !== undefined){
if(typeof data36.source_url !== "string"){
const err89 = {instancePath:instancePath+"/findings/" + i4+"/evidence/source_url",schemaPath:"#/$defs/finding/properties/evidence/properties/source_url/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
}
if(data36.artifact_class !== undefined){
if(typeof data36.artifact_class !== "string"){
const err90 = {instancePath:instancePath+"/findings/" + i4+"/evidence/artifact_class",schemaPath:"#/$defs/finding/properties/evidence/properties/artifact_class/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
}
if(data36.proof_citation !== undefined){
if(typeof data36.proof_citation !== "string"){
const err91 = {instancePath:instancePath+"/findings/" + i4+"/evidence/proof_citation",schemaPath:"#/$defs/finding/properties/evidence/properties/proof_citation/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
}
if(data36.evidence_mode !== undefined){
if(typeof data36.evidence_mode !== "string"){
const err92 = {instancePath:instancePath+"/findings/" + i4+"/evidence/evidence_mode",schemaPath:"#/$defs/finding/properties/evidence/properties/evidence_mode/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
}
if(data36.source_hash !== undefined){
if(typeof data36.source_hash !== "string"){
const err93 = {instancePath:instancePath+"/findings/" + i4+"/evidence/source_hash",schemaPath:"#/$defs/finding/properties/evidence/properties/source_hash/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
}
if(data36.extracted_excerpt !== undefined){
if(typeof data36.extracted_excerpt !== "string"){
const err94 = {instancePath:instancePath+"/findings/" + i4+"/evidence/extracted_excerpt",schemaPath:"#/$defs/finding/properties/evidence/properties/extracted_excerpt/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
}
}
else {
const err95 = {instancePath:instancePath+"/findings/" + i4+"/evidence",schemaPath:"#/$defs/finding/properties/evidence/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
}
if(data20.trigger_evaluation !== undefined){
let data43 = data20.trigger_evaluation;
if(data43 && typeof data43 == "object" && !Array.isArray(data43)){
if(data43.conditions_passed === undefined){
const err96 = {instancePath:instancePath+"/findings/" + i4+"/trigger_evaluation",schemaPath:"#/$defs/finding/properties/trigger_evaluation/required",keyword:"required",params:{missingProperty: "conditions_passed"},message:"must have required property '"+"conditions_passed"+"'"};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
if(data43.conditions_failed === undefined){
const err97 = {instancePath:instancePath+"/findings/" + i4+"/trigger_evaluation",schemaPath:"#/$defs/finding/properties/trigger_evaluation/required",keyword:"required",params:{missingProperty: "conditions_failed"},message:"must have required property '"+"conditions_failed"+"'"};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
if(data43.trigger_if_result === undefined){
const err98 = {instancePath:instancePath+"/findings/" + i4+"/trigger_evaluation",schemaPath:"#/$defs/finding/properties/trigger_evaluation/required",keyword:"required",params:{missingProperty: "trigger_if_result"},message:"must have required property '"+"trigger_if_result"+"'"};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
if(data43.exclude_if_result === undefined){
const err99 = {instancePath:instancePath+"/findings/" + i4+"/trigger_evaluation",schemaPath:"#/$defs/finding/properties/trigger_evaluation/required",keyword:"required",params:{missingProperty: "exclude_if_result"},message:"must have required property '"+"exclude_if_result"+"'"};
if(vErrors === null){
vErrors = [err99];
}
else {
vErrors.push(err99);
}
errors++;
}
if(data43.exclude_if_basis === undefined){
const err100 = {instancePath:instancePath+"/findings/" + i4+"/trigger_evaluation",schemaPath:"#/$defs/finding/properties/trigger_evaluation/required",keyword:"required",params:{missingProperty: "exclude_if_basis"},message:"must have required property '"+"exclude_if_basis"+"'"};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
for(const key4 in data43){
if(!(((((key4 === "conditions_passed") || (key4 === "conditions_failed")) || (key4 === "trigger_if_result")) || (key4 === "exclude_if_result")) || (key4 === "exclude_if_basis"))){
const err101 = {instancePath:instancePath+"/findings/" + i4+"/trigger_evaluation",schemaPath:"#/$defs/finding/properties/trigger_evaluation/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
}
if(data43.conditions_passed !== undefined){
let data44 = data43.conditions_passed;
if(Array.isArray(data44)){
const len7 = data44.length;
for(let i7=0; i7<len7; i7++){
if(typeof data44[i7] !== "string"){
const err102 = {instancePath:instancePath+"/findings/" + i4+"/trigger_evaluation/conditions_passed/" + i7,schemaPath:"#/$defs/finding/properties/trigger_evaluation/properties/conditions_passed/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
}
}
else {
const err103 = {instancePath:instancePath+"/findings/" + i4+"/trigger_evaluation/conditions_passed",schemaPath:"#/$defs/finding/properties/trigger_evaluation/properties/conditions_passed/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
}
if(data43.conditions_failed !== undefined){
let data46 = data43.conditions_failed;
if(Array.isArray(data46)){
const len8 = data46.length;
for(let i8=0; i8<len8; i8++){
if(typeof data46[i8] !== "string"){
const err104 = {instancePath:instancePath+"/findings/" + i4+"/trigger_evaluation/conditions_failed/" + i8,schemaPath:"#/$defs/finding/properties/trigger_evaluation/properties/conditions_failed/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err104];
}
else {
vErrors.push(err104);
}
errors++;
}
}
}
else {
const err105 = {instancePath:instancePath+"/findings/" + i4+"/trigger_evaluation/conditions_failed",schemaPath:"#/$defs/finding/properties/trigger_evaluation/properties/conditions_failed/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
}
if(data43.trigger_if_result !== undefined){
if(typeof data43.trigger_if_result !== "boolean"){
const err106 = {instancePath:instancePath+"/findings/" + i4+"/trigger_evaluation/trigger_if_result",schemaPath:"#/$defs/finding/properties/trigger_evaluation/properties/trigger_if_result/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err106];
}
else {
vErrors.push(err106);
}
errors++;
}
}
if(data43.exclude_if_result !== undefined){
if(typeof data43.exclude_if_result !== "boolean"){
const err107 = {instancePath:instancePath+"/findings/" + i4+"/trigger_evaluation/exclude_if_result",schemaPath:"#/$defs/finding/properties/trigger_evaluation/properties/exclude_if_result/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
}
if(data43.exclude_if_basis !== undefined){
if(typeof data43.exclude_if_basis !== "string"){
const err108 = {instancePath:instancePath+"/findings/" + i4+"/trigger_evaluation/exclude_if_basis",schemaPath:"#/$defs/finding/properties/trigger_evaluation/properties/exclude_if_basis/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err108];
}
else {
vErrors.push(err108);
}
errors++;
}
}
}
else {
const err109 = {instancePath:instancePath+"/findings/" + i4+"/trigger_evaluation",schemaPath:"#/$defs/finding/properties/trigger_evaluation/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
}
if(data20.registry_payload !== undefined){
let data51 = data20.registry_payload;
if(data51 && typeof data51 == "object" && !Array.isArray(data51)){
if(data51.legal_pain === undefined){
const err110 = {instancePath:instancePath+"/findings/" + i4+"/registry_payload",schemaPath:"#/$defs/finding/properties/registry_payload/required",keyword:"required",params:{missingProperty: "legal_pain"},message:"must have required property '"+"legal_pain"+"'"};
if(vErrors === null){
vErrors = [err110];
}
else {
vErrors.push(err110);
}
errors++;
}
if(data51.fp_mechanism === undefined){
const err111 = {instancePath:instancePath+"/findings/" + i4+"/registry_payload",schemaPath:"#/$defs/finding/properties/registry_payload/required",keyword:"required",params:{missingProperty: "fp_mechanism"},message:"must have required property '"+"fp_mechanism"+"'"};
if(vErrors === null){
vErrors = [err111];
}
else {
vErrors.push(err111);
}
errors++;
}
if(data51.fp_impact === undefined){
const err112 = {instancePath:instancePath+"/findings/" + i4+"/registry_payload",schemaPath:"#/$defs/finding/properties/registry_payload/required",keyword:"required",params:{missingProperty: "fp_impact"},message:"must have required property '"+"fp_impact"+"'"};
if(vErrors === null){
vErrors = [err112];
}
else {
vErrors.push(err112);
}
errors++;
}
if(data51.lex_nova_fix === undefined){
const err113 = {instancePath:instancePath+"/findings/" + i4+"/registry_payload",schemaPath:"#/$defs/finding/properties/registry_payload/required",keyword:"required",params:{missingProperty: "lex_nova_fix"},message:"must have required property '"+"lex_nova_fix"+"'"};
if(vErrors === null){
vErrors = [err113];
}
else {
vErrors.push(err113);
}
errors++;
}
for(const key5 in data51){
if(!((((key5 === "legal_pain") || (key5 === "fp_mechanism")) || (key5 === "fp_impact")) || (key5 === "lex_nova_fix"))){
const err114 = {instancePath:instancePath+"/findings/" + i4+"/registry_payload",schemaPath:"#/$defs/finding/properties/registry_payload/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err114];
}
else {
vErrors.push(err114);
}
errors++;
}
}
if(data51.legal_pain !== undefined){
if(typeof data51.legal_pain !== "string"){
const err115 = {instancePath:instancePath+"/findings/" + i4+"/registry_payload/legal_pain",schemaPath:"#/$defs/finding/properties/registry_payload/properties/legal_pain/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err115];
}
else {
vErrors.push(err115);
}
errors++;
}
}
if(data51.fp_mechanism !== undefined){
if(typeof data51.fp_mechanism !== "string"){
const err116 = {instancePath:instancePath+"/findings/" + i4+"/registry_payload/fp_mechanism",schemaPath:"#/$defs/finding/properties/registry_payload/properties/fp_mechanism/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err116];
}
else {
vErrors.push(err116);
}
errors++;
}
}
if(data51.fp_impact !== undefined){
if(typeof data51.fp_impact !== "string"){
const err117 = {instancePath:instancePath+"/findings/" + i4+"/registry_payload/fp_impact",schemaPath:"#/$defs/finding/properties/registry_payload/properties/fp_impact/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
}
if(data51.lex_nova_fix !== undefined){
if(typeof data51.lex_nova_fix !== "string"){
const err118 = {instancePath:instancePath+"/findings/" + i4+"/registry_payload/lex_nova_fix",schemaPath:"#/$defs/finding/properties/registry_payload/properties/lex_nova_fix/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
}
}
else {
const err119 = {instancePath:instancePath+"/findings/" + i4+"/registry_payload",schemaPath:"#/$defs/finding/properties/registry_payload/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err119];
}
else {
vErrors.push(err119);
}
errors++;
}
}
if(data20.redline_route !== undefined){
let data56 = data20.redline_route;
if(Array.isArray(data56)){
const len9 = data56.length;
for(let i9=0; i9<len9; i9++){
if(typeof data56[i9] !== "string"){
const err120 = {instancePath:instancePath+"/findings/" + i4+"/redline_route/" + i9,schemaPath:"#/$defs/finding/properties/redline_route/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
}
}
else {
const err121 = {instancePath:instancePath+"/findings/" + i4+"/redline_route",schemaPath:"#/$defs/finding/properties/redline_route/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err121];
}
else {
vErrors.push(err121);
}
errors++;
}
}
if(data20.document_routes !== undefined){
let data58 = data20.document_routes;
if(Array.isArray(data58)){
const len10 = data58.length;
for(let i10=0; i10<len10; i10++){
if(typeof data58[i10] !== "string"){
const err122 = {instancePath:instancePath+"/findings/" + i4+"/document_routes/" + i10,schemaPath:"#/$defs/finding/properties/document_routes/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
}
}
else {
const err123 = {instancePath:instancePath+"/findings/" + i4+"/document_routes",schemaPath:"#/$defs/finding/properties/document_routes/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err123];
}
else {
vErrors.push(err123);
}
errors++;
}
}
if(data20.vault_dependencies !== undefined){
let data60 = data20.vault_dependencies;
if(Array.isArray(data60)){
const len11 = data60.length;
for(let i11=0; i11<len11; i11++){
if(typeof data60[i11] !== "string"){
const err124 = {instancePath:instancePath+"/findings/" + i4+"/vault_dependencies/" + i11,schemaPath:"#/$defs/finding/properties/vault_dependencies/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
}
}
else {
const err125 = {instancePath:instancePath+"/findings/" + i4+"/vault_dependencies",schemaPath:"#/$defs/finding/properties/vault_dependencies/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err125];
}
else {
vErrors.push(err125);
}
errors++;
}
}
if(data20.finding_memo_note !== undefined){
if(typeof data20.finding_memo_note !== "string"){
const err126 = {instancePath:instancePath+"/findings/" + i4+"/finding_memo_note",schemaPath:"#/$defs/finding/properties/finding_memo_note/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err126];
}
else {
vErrors.push(err126);
}
errors++;
}
}
}
else {
const err127 = {instancePath:instancePath+"/findings/" + i4,schemaPath:"#/$defs/finding/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err127];
}
else {
vErrors.push(err127);
}
errors++;
}
}
}
else {
const err128 = {instancePath:instancePath+"/findings",schemaPath:"#/properties/findings/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err128];
}
else {
vErrors.push(err128);
}
errors++;
}
}
if(data.controlled_rows !== undefined){
let data63 = data.controlled_rows;
if(Array.isArray(data63)){
const len12 = data63.length;
for(let i12=0; i12<len12; i12++){
let data64 = data63[i12];
if(data64 && typeof data64 == "object" && !Array.isArray(data64)){
if(data64.threat_id === undefined){
const err129 = {instancePath:instancePath+"/controlled_rows/" + i12,schemaPath:"#/$defs/statusRow/required",keyword:"required",params:{missingProperty: "threat_id"},message:"must have required property '"+"threat_id"+"'"};
if(vErrors === null){
vErrors = [err129];
}
else {
vErrors.push(err129);
}
errors++;
}
if(data64.threat_name === undefined){
const err130 = {instancePath:instancePath+"/controlled_rows/" + i12,schemaPath:"#/$defs/statusRow/required",keyword:"required",params:{missingProperty: "threat_name"},message:"must have required property '"+"threat_name"+"'"};
if(vErrors === null){
vErrors = [err130];
}
else {
vErrors.push(err130);
}
errors++;
}
if(data64.status === undefined){
const err131 = {instancePath:instancePath+"/controlled_rows/" + i12,schemaPath:"#/$defs/statusRow/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err131];
}
else {
vErrors.push(err131);
}
errors++;
}
if(data64.reasoning_summary === undefined){
const err132 = {instancePath:instancePath+"/controlled_rows/" + i12,schemaPath:"#/$defs/statusRow/required",keyword:"required",params:{missingProperty: "reasoning_summary"},message:"must have required property '"+"reasoning_summary"+"'"};
if(vErrors === null){
vErrors = [err132];
}
else {
vErrors.push(err132);
}
errors++;
}
if(data64.threat_id !== undefined){
if(typeof data64.threat_id !== "string"){
const err133 = {instancePath:instancePath+"/controlled_rows/" + i12+"/threat_id",schemaPath:"#/$defs/statusRow/properties/threat_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err133];
}
else {
vErrors.push(err133);
}
errors++;
}
}
if(data64.threat_name !== undefined){
if(typeof data64.threat_name !== "string"){
const err134 = {instancePath:instancePath+"/controlled_rows/" + i12+"/threat_name",schemaPath:"#/$defs/statusRow/properties/threat_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err134];
}
else {
vErrors.push(err134);
}
errors++;
}
}
if(data64.status !== undefined){
let data67 = data64.status;
if(typeof data67 !== "string"){
const err135 = {instancePath:instancePath+"/controlled_rows/" + i12+"/status",schemaPath:"#/$defs/statusRow/properties/status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err135];
}
else {
vErrors.push(err135);
}
errors++;
}
if(!((data67 === "CONTROLLED") || (data67 === "INSUFFICIENT_EVIDENCE"))){
const err136 = {instancePath:instancePath+"/controlled_rows/" + i12+"/status",schemaPath:"#/$defs/statusRow/properties/status/enum",keyword:"enum",params:{allowedValues: schema69.properties.status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err136];
}
else {
vErrors.push(err136);
}
errors++;
}
}
if(data64.reasoning_summary !== undefined){
if(typeof data64.reasoning_summary !== "string"){
const err137 = {instancePath:instancePath+"/controlled_rows/" + i12+"/reasoning_summary",schemaPath:"#/$defs/statusRow/properties/reasoning_summary/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err137];
}
else {
vErrors.push(err137);
}
errors++;
}
}
}
else {
const err138 = {instancePath:instancePath+"/controlled_rows/" + i12,schemaPath:"#/$defs/statusRow/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err138];
}
else {
vErrors.push(err138);
}
errors++;
}
}
}
else {
const err139 = {instancePath:instancePath+"/controlled_rows",schemaPath:"#/properties/controlled_rows/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err139];
}
else {
vErrors.push(err139);
}
errors++;
}
}
if(data.insufficient_evidence_rows !== undefined){
let data69 = data.insufficient_evidence_rows;
if(Array.isArray(data69)){
const len13 = data69.length;
for(let i13=0; i13<len13; i13++){
let data70 = data69[i13];
if(data70 && typeof data70 == "object" && !Array.isArray(data70)){
if(data70.threat_id === undefined){
const err140 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i13,schemaPath:"#/$defs/statusRow/required",keyword:"required",params:{missingProperty: "threat_id"},message:"must have required property '"+"threat_id"+"'"};
if(vErrors === null){
vErrors = [err140];
}
else {
vErrors.push(err140);
}
errors++;
}
if(data70.threat_name === undefined){
const err141 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i13,schemaPath:"#/$defs/statusRow/required",keyword:"required",params:{missingProperty: "threat_name"},message:"must have required property '"+"threat_name"+"'"};
if(vErrors === null){
vErrors = [err141];
}
else {
vErrors.push(err141);
}
errors++;
}
if(data70.status === undefined){
const err142 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i13,schemaPath:"#/$defs/statusRow/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err142];
}
else {
vErrors.push(err142);
}
errors++;
}
if(data70.reasoning_summary === undefined){
const err143 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i13,schemaPath:"#/$defs/statusRow/required",keyword:"required",params:{missingProperty: "reasoning_summary"},message:"must have required property '"+"reasoning_summary"+"'"};
if(vErrors === null){
vErrors = [err143];
}
else {
vErrors.push(err143);
}
errors++;
}
if(data70.threat_id !== undefined){
if(typeof data70.threat_id !== "string"){
const err144 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i13+"/threat_id",schemaPath:"#/$defs/statusRow/properties/threat_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err144];
}
else {
vErrors.push(err144);
}
errors++;
}
}
if(data70.threat_name !== undefined){
if(typeof data70.threat_name !== "string"){
const err145 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i13+"/threat_name",schemaPath:"#/$defs/statusRow/properties/threat_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err145];
}
else {
vErrors.push(err145);
}
errors++;
}
}
if(data70.status !== undefined){
let data73 = data70.status;
if(typeof data73 !== "string"){
const err146 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i13+"/status",schemaPath:"#/$defs/statusRow/properties/status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err146];
}
else {
vErrors.push(err146);
}
errors++;
}
if(!((data73 === "CONTROLLED") || (data73 === "INSUFFICIENT_EVIDENCE"))){
const err147 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i13+"/status",schemaPath:"#/$defs/statusRow/properties/status/enum",keyword:"enum",params:{allowedValues: schema69.properties.status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err147];
}
else {
vErrors.push(err147);
}
errors++;
}
}
if(data70.reasoning_summary !== undefined){
if(typeof data70.reasoning_summary !== "string"){
const err148 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i13+"/reasoning_summary",schemaPath:"#/$defs/statusRow/properties/reasoning_summary/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err148];
}
else {
vErrors.push(err148);
}
errors++;
}
}
}
else {
const err149 = {instancePath:instancePath+"/insufficient_evidence_rows/" + i13,schemaPath:"#/$defs/statusRow/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err149];
}
else {
vErrors.push(err149);
}
errors++;
}
}
}
else {
const err150 = {instancePath:instancePath+"/insufficient_evidence_rows",schemaPath:"#/properties/insufficient_evidence_rows/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err150];
}
else {
vErrors.push(err150);
}
errors++;
}
}
if(data.report_data !== undefined){
let data75 = data.report_data;
if(data75 && typeof data75 == "object" && !Array.isArray(data75)){
if(data75.executive_report === undefined){
const err151 = {instancePath:instancePath+"/report_data",schemaPath:"#/properties/report_data/required",keyword:"required",params:{missingProperty: "executive_report"},message:"must have required property '"+"executive_report"+"'"};
if(vErrors === null){
vErrors = [err151];
}
else {
vErrors.push(err151);
}
errors++;
}
if(data75.full_forensic_record === undefined){
const err152 = {instancePath:instancePath+"/report_data",schemaPath:"#/properties/report_data/required",keyword:"required",params:{missingProperty: "full_forensic_record"},message:"must have required property '"+"full_forensic_record"+"'"};
if(vErrors === null){
vErrors = [err152];
}
else {
vErrors.push(err152);
}
errors++;
}
for(const key6 in data75){
if(!((key6 === "executive_report") || (key6 === "full_forensic_record"))){
const err153 = {instancePath:instancePath+"/report_data",schemaPath:"#/properties/report_data/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key6},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err153];
}
else {
vErrors.push(err153);
}
errors++;
}
}
if(data75.executive_report !== undefined){
let data76 = data75.executive_report;
if(data76 && typeof data76 == "object" && !Array.isArray(data76)){
if(data76.cover_reliance === undefined){
const err154 = {instancePath:instancePath+"/report_data/executive_report",schemaPath:"#/properties/report_data/properties/executive_report/required",keyword:"required",params:{missingProperty: "cover_reliance"},message:"must have required property '"+"cover_reliance"+"'"};
if(vErrors === null){
vErrors = [err154];
}
else {
vErrors.push(err154);
}
errors++;
}
if(data76.scope_methodology === undefined){
const err155 = {instancePath:instancePath+"/report_data/executive_report",schemaPath:"#/properties/report_data/properties/executive_report/required",keyword:"required",params:{missingProperty: "scope_methodology"},message:"must have required property '"+"scope_methodology"+"'"};
if(vErrors === null){
vErrors = [err155];
}
else {
vErrors.push(err155);
}
errors++;
}
if(data76.subject_profile === undefined){
const err156 = {instancePath:instancePath+"/report_data/executive_report",schemaPath:"#/properties/report_data/properties/executive_report/required",keyword:"required",params:{missingProperty: "subject_profile"},message:"must have required property '"+"subject_profile"+"'"};
if(vErrors === null){
vErrors = [err156];
}
else {
vErrors.push(err156);
}
errors++;
}
if(data76.risk_posture_summary === undefined){
const err157 = {instancePath:instancePath+"/report_data/executive_report",schemaPath:"#/properties/report_data/properties/executive_report/required",keyword:"required",params:{missingProperty: "risk_posture_summary"},message:"must have required property '"+"risk_posture_summary"+"'"};
if(vErrors === null){
vErrors = [err157];
}
else {
vErrors.push(err157);
}
errors++;
}
if(data76.material_findings_highlights === undefined){
const err158 = {instancePath:instancePath+"/report_data/executive_report",schemaPath:"#/properties/report_data/properties/executive_report/required",keyword:"required",params:{missingProperty: "material_findings_highlights"},message:"must have required property '"+"material_findings_highlights"+"'"};
if(vErrors === null){
vErrors = [err158];
}
else {
vErrors.push(err158);
}
errors++;
}
if(data76.triggered_findings_schedule === undefined){
const err159 = {instancePath:instancePath+"/report_data/executive_report",schemaPath:"#/properties/report_data/properties/executive_report/required",keyword:"required",params:{missingProperty: "triggered_findings_schedule"},message:"must have required property '"+"triggered_findings_schedule"+"'"};
if(vErrors === null){
vErrors = [err159];
}
else {
vErrors.push(err159);
}
errors++;
}
if(data76.document_stack_verdict === undefined){
const err160 = {instancePath:instancePath+"/report_data/executive_report",schemaPath:"#/properties/report_data/properties/executive_report/required",keyword:"required",params:{missingProperty: "document_stack_verdict"},message:"must have required property '"+"document_stack_verdict"+"'"};
if(vErrors === null){
vErrors = [err160];
}
else {
vErrors.push(err160);
}
errors++;
}
if(data76.recommended_route === undefined){
const err161 = {instancePath:instancePath+"/report_data/executive_report",schemaPath:"#/properties/report_data/properties/executive_report/required",keyword:"required",params:{missingProperty: "recommended_route"},message:"must have required property '"+"recommended_route"+"'"};
if(vErrors === null){
vErrors = [err161];
}
else {
vErrors.push(err161);
}
errors++;
}
for(const key7 in data76){
if(!((((((((key7 === "cover_reliance") || (key7 === "scope_methodology")) || (key7 === "subject_profile")) || (key7 === "risk_posture_summary")) || (key7 === "material_findings_highlights")) || (key7 === "triggered_findings_schedule")) || (key7 === "document_stack_verdict")) || (key7 === "recommended_route"))){
const err162 = {instancePath:instancePath+"/report_data/executive_report",schemaPath:"#/properties/report_data/properties/executive_report/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key7},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err162];
}
else {
vErrors.push(err162);
}
errors++;
}
}
if(data76.cover_reliance !== undefined){
let data77 = data76.cover_reliance;
if(data77 && typeof data77 == "object" && !Array.isArray(data77)){
}
else {
const err163 = {instancePath:instancePath+"/report_data/executive_report/cover_reliance",schemaPath:"#/properties/report_data/properties/executive_report/properties/cover_reliance/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err163];
}
else {
vErrors.push(err163);
}
errors++;
}
}
if(data76.scope_methodology !== undefined){
let data78 = data76.scope_methodology;
if(data78 && typeof data78 == "object" && !Array.isArray(data78)){
}
else {
const err164 = {instancePath:instancePath+"/report_data/executive_report/scope_methodology",schemaPath:"#/properties/report_data/properties/executive_report/properties/scope_methodology/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err164];
}
else {
vErrors.push(err164);
}
errors++;
}
}
if(data76.subject_profile !== undefined){
let data79 = data76.subject_profile;
if(data79 && typeof data79 == "object" && !Array.isArray(data79)){
}
else {
const err165 = {instancePath:instancePath+"/report_data/executive_report/subject_profile",schemaPath:"#/properties/report_data/properties/executive_report/properties/subject_profile/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err165];
}
else {
vErrors.push(err165);
}
errors++;
}
}
if(data76.risk_posture_summary !== undefined){
let data80 = data76.risk_posture_summary;
if(data80 && typeof data80 == "object" && !Array.isArray(data80)){
}
else {
const err166 = {instancePath:instancePath+"/report_data/executive_report/risk_posture_summary",schemaPath:"#/properties/report_data/properties/executive_report/properties/risk_posture_summary/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err166];
}
else {
vErrors.push(err166);
}
errors++;
}
}
if(data76.material_findings_highlights !== undefined){
let data81 = data76.material_findings_highlights;
if(Array.isArray(data81)){
const len14 = data81.length;
for(let i14=0; i14<len14; i14++){
let data82 = data81[i14];
if(data82 && typeof data82 == "object" && !Array.isArray(data82)){
}
else {
const err167 = {instancePath:instancePath+"/report_data/executive_report/material_findings_highlights/" + i14,schemaPath:"#/properties/report_data/properties/executive_report/properties/material_findings_highlights/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err167];
}
else {
vErrors.push(err167);
}
errors++;
}
}
}
else {
const err168 = {instancePath:instancePath+"/report_data/executive_report/material_findings_highlights",schemaPath:"#/properties/report_data/properties/executive_report/properties/material_findings_highlights/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err168];
}
else {
vErrors.push(err168);
}
errors++;
}
}
if(data76.triggered_findings_schedule !== undefined){
let data83 = data76.triggered_findings_schedule;
if(Array.isArray(data83)){
const len15 = data83.length;
for(let i15=0; i15<len15; i15++){
let data84 = data83[i15];
if(data84 && typeof data84 == "object" && !Array.isArray(data84)){
if(data84.threat_id === undefined){
const err169 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i15,schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/required",keyword:"required",params:{missingProperty: "threat_id"},message:"must have required property '"+"threat_id"+"'"};
if(vErrors === null){
vErrors = [err169];
}
else {
vErrors.push(err169);
}
errors++;
}
if(data84.threat_name === undefined){
const err170 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i15,schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/required",keyword:"required",params:{missingProperty: "threat_name"},message:"must have required property '"+"threat_name"+"'"};
if(vErrors === null){
vErrors = [err170];
}
else {
vErrors.push(err170);
}
errors++;
}
if(data84.pain_category === undefined){
const err171 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i15,schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/required",keyword:"required",params:{missingProperty: "pain_category"},message:"must have required property '"+"pain_category"+"'"};
if(vErrors === null){
vErrors = [err171];
}
else {
vErrors.push(err171);
}
errors++;
}
if(data84.archetype === undefined){
const err172 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i15,schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/required",keyword:"required",params:{missingProperty: "archetype"},message:"must have required property '"+"archetype"+"'"};
if(vErrors === null){
vErrors = [err172];
}
else {
vErrors.push(err172);
}
errors++;
}
if(data84.linked_feature === undefined){
const err173 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i15,schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/required",keyword:"required",params:{missingProperty: "linked_feature"},message:"must have required property '"+"linked_feature"+"'"};
if(vErrors === null){
vErrors = [err173];
}
else {
vErrors.push(err173);
}
errors++;
}
if(data84.document_route === undefined){
const err174 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i15,schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/required",keyword:"required",params:{missingProperty: "document_route"},message:"must have required property '"+"document_route"+"'"};
if(vErrors === null){
vErrors = [err174];
}
else {
vErrors.push(err174);
}
errors++;
}
if(data84.short_issue === undefined){
const err175 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i15,schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/required",keyword:"required",params:{missingProperty: "short_issue"},message:"must have required property '"+"short_issue"+"'"};
if(vErrors === null){
vErrors = [err175];
}
else {
vErrors.push(err175);
}
errors++;
}
for(const key8 in data84){
if(!(((((((key8 === "threat_id") || (key8 === "threat_name")) || (key8 === "pain_category")) || (key8 === "archetype")) || (key8 === "linked_feature")) || (key8 === "document_route")) || (key8 === "short_issue"))){
const err176 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i15,schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key8},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err176];
}
else {
vErrors.push(err176);
}
errors++;
}
}
if(data84.threat_id !== undefined){
if(typeof data84.threat_id !== "string"){
const err177 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i15+"/threat_id",schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/properties/threat_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err177];
}
else {
vErrors.push(err177);
}
errors++;
}
}
if(data84.threat_name !== undefined){
if(typeof data84.threat_name !== "string"){
const err178 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i15+"/threat_name",schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/properties/threat_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err178];
}
else {
vErrors.push(err178);
}
errors++;
}
}
if(data84.pain_category !== undefined){
if(typeof data84.pain_category !== "string"){
const err179 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i15+"/pain_category",schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/properties/pain_category/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err179];
}
else {
vErrors.push(err179);
}
errors++;
}
}
if(data84.archetype !== undefined){
if(typeof data84.archetype !== "string"){
const err180 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i15+"/archetype",schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/properties/archetype/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err180];
}
else {
vErrors.push(err180);
}
errors++;
}
}
if(data84.linked_feature !== undefined){
if(typeof data84.linked_feature !== "string"){
const err181 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i15+"/linked_feature",schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/properties/linked_feature/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err181];
}
else {
vErrors.push(err181);
}
errors++;
}
}
if(data84.document_route !== undefined){
if(typeof data84.document_route !== "string"){
const err182 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i15+"/document_route",schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/properties/document_route/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err182];
}
else {
vErrors.push(err182);
}
errors++;
}
}
if(data84.short_issue !== undefined){
if(typeof data84.short_issue !== "string"){
const err183 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i15+"/short_issue",schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/properties/short_issue/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err183];
}
else {
vErrors.push(err183);
}
errors++;
}
}
}
else {
const err184 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule/" + i15,schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err184];
}
else {
vErrors.push(err184);
}
errors++;
}
}
}
else {
const err185 = {instancePath:instancePath+"/report_data/executive_report/triggered_findings_schedule",schemaPath:"#/properties/report_data/properties/executive_report/properties/triggered_findings_schedule/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err185];
}
else {
vErrors.push(err185);
}
errors++;
}
}
if(data76.document_stack_verdict !== undefined){
let data92 = data76.document_stack_verdict;
if(data92 && typeof data92 == "object" && !Array.isArray(data92)){
}
else {
const err186 = {instancePath:instancePath+"/report_data/executive_report/document_stack_verdict",schemaPath:"#/properties/report_data/properties/executive_report/properties/document_stack_verdict/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err186];
}
else {
vErrors.push(err186);
}
errors++;
}
}
if(data76.recommended_route !== undefined){
let data93 = data76.recommended_route;
if(data93 && typeof data93 == "object" && !Array.isArray(data93)){
}
else {
const err187 = {instancePath:instancePath+"/report_data/executive_report/recommended_route",schemaPath:"#/properties/report_data/properties/executive_report/properties/recommended_route/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err187];
}
else {
vErrors.push(err187);
}
errors++;
}
}
}
else {
const err188 = {instancePath:instancePath+"/report_data/executive_report",schemaPath:"#/properties/report_data/properties/executive_report/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err188];
}
else {
vErrors.push(err188);
}
errors++;
}
}
if(data75.full_forensic_record !== undefined){
let data94 = data75.full_forensic_record;
if(data94 && typeof data94 == "object" && !Array.isArray(data94)){
if(data94.source_review === undefined){
const err189 = {instancePath:instancePath+"/report_data/full_forensic_record",schemaPath:"#/properties/report_data/properties/full_forensic_record/required",keyword:"required",params:{missingProperty: "source_review"},message:"must have required property '"+"source_review"+"'"};
if(vErrors === null){
vErrors = [err189];
}
else {
vErrors.push(err189);
}
errors++;
}
if(data94.product_feature_map === undefined){
const err190 = {instancePath:instancePath+"/report_data/full_forensic_record",schemaPath:"#/properties/report_data/properties/full_forensic_record/required",keyword:"required",params:{missingProperty: "product_feature_map"},message:"must have required property '"+"product_feature_map"+"'"};
if(vErrors === null){
vErrors = [err190];
}
else {
vErrors.push(err190);
}
errors++;
}
if(data94.feature_to_threat_matrix === undefined){
const err191 = {instancePath:instancePath+"/report_data/full_forensic_record",schemaPath:"#/properties/report_data/properties/full_forensic_record/required",keyword:"required",params:{missingProperty: "feature_to_threat_matrix"},message:"must have required property '"+"feature_to_threat_matrix"+"'"};
if(vErrors === null){
vErrors = [err191];
}
else {
vErrors.push(err191);
}
errors++;
}
if(data94.document_stack_redline === undefined){
const err192 = {instancePath:instancePath+"/report_data/full_forensic_record",schemaPath:"#/properties/report_data/properties/full_forensic_record/required",keyword:"required",params:{missingProperty: "document_stack_redline"},message:"must have required property '"+"document_stack_redline"+"'"};
if(vErrors === null){
vErrors = [err192];
}
else {
vErrors.push(err192);
}
errors++;
}
if(data94.triggered_findings === undefined){
const err193 = {instancePath:instancePath+"/report_data/full_forensic_record",schemaPath:"#/properties/report_data/properties/full_forensic_record/required",keyword:"required",params:{missingProperty: "triggered_findings"},message:"must have required property '"+"triggered_findings"+"'"};
if(vErrors === null){
vErrors = [err193];
}
else {
vErrors.push(err193);
}
errors++;
}
if(data94.controlled_rows === undefined){
const err194 = {instancePath:instancePath+"/report_data/full_forensic_record",schemaPath:"#/properties/report_data/properties/full_forensic_record/required",keyword:"required",params:{missingProperty: "controlled_rows"},message:"must have required property '"+"controlled_rows"+"'"};
if(vErrors === null){
vErrors = [err194];
}
else {
vErrors.push(err194);
}
errors++;
}
if(data94.insufficient_evidence_rows === undefined){
const err195 = {instancePath:instancePath+"/report_data/full_forensic_record",schemaPath:"#/properties/report_data/properties/full_forensic_record/required",keyword:"required",params:{missingProperty: "insufficient_evidence_rows"},message:"must have required property '"+"insufficient_evidence_rows"+"'"};
if(vErrors === null){
vErrors = [err195];
}
else {
vErrors.push(err195);
}
errors++;
}
if(data94.assembly_route === undefined){
const err196 = {instancePath:instancePath+"/report_data/full_forensic_record",schemaPath:"#/properties/report_data/properties/full_forensic_record/required",keyword:"required",params:{missingProperty: "assembly_route"},message:"must have required property '"+"assembly_route"+"'"};
if(vErrors === null){
vErrors = [err196];
}
else {
vErrors.push(err196);
}
errors++;
}
if(data94.technical_audit_log === undefined){
const err197 = {instancePath:instancePath+"/report_data/full_forensic_record",schemaPath:"#/properties/report_data/properties/full_forensic_record/required",keyword:"required",params:{missingProperty: "technical_audit_log"},message:"must have required property '"+"technical_audit_log"+"'"};
if(vErrors === null){
vErrors = [err197];
}
else {
vErrors.push(err197);
}
errors++;
}
for(const key9 in data94){
if(!(func1.call(schema67.properties.report_data.properties.full_forensic_record.properties, key9))){
const err198 = {instancePath:instancePath+"/report_data/full_forensic_record",schemaPath:"#/properties/report_data/properties/full_forensic_record/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key9},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err198];
}
else {
vErrors.push(err198);
}
errors++;
}
}
if(data94.source_review !== undefined){
let data95 = data94.source_review;
if(data95 && typeof data95 == "object" && !Array.isArray(data95)){
}
else {
const err199 = {instancePath:instancePath+"/report_data/full_forensic_record/source_review",schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/source_review/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err199];
}
else {
vErrors.push(err199);
}
errors++;
}
}
if(data94.product_feature_map !== undefined){
let data96 = data94.product_feature_map;
if(Array.isArray(data96)){
const len16 = data96.length;
for(let i16=0; i16<len16; i16++){
let data97 = data96[i16];
if(data97 && typeof data97 == "object" && !Array.isArray(data97)){
}
else {
const err200 = {instancePath:instancePath+"/report_data/full_forensic_record/product_feature_map/" + i16,schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/product_feature_map/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err200];
}
else {
vErrors.push(err200);
}
errors++;
}
}
}
else {
const err201 = {instancePath:instancePath+"/report_data/full_forensic_record/product_feature_map",schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/product_feature_map/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err201];
}
else {
vErrors.push(err201);
}
errors++;
}
}
if(data94.feature_to_threat_matrix !== undefined){
let data98 = data94.feature_to_threat_matrix;
if(Array.isArray(data98)){
const len17 = data98.length;
for(let i17=0; i17<len17; i17++){
let data99 = data98[i17];
if(data99 && typeof data99 == "object" && !Array.isArray(data99)){
}
else {
const err202 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix/" + i17,schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/feature_to_threat_matrix/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err202];
}
else {
vErrors.push(err202);
}
errors++;
}
}
}
else {
const err203 = {instancePath:instancePath+"/report_data/full_forensic_record/feature_to_threat_matrix",schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/feature_to_threat_matrix/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err203];
}
else {
vErrors.push(err203);
}
errors++;
}
}
if(data94.document_stack_redline !== undefined){
let data100 = data94.document_stack_redline;
if(Array.isArray(data100)){
const len18 = data100.length;
for(let i18=0; i18<len18; i18++){
let data101 = data100[i18];
if(data101 && typeof data101 == "object" && !Array.isArray(data101)){
}
else {
const err204 = {instancePath:instancePath+"/report_data/full_forensic_record/document_stack_redline/" + i18,schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/document_stack_redline/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err204];
}
else {
vErrors.push(err204);
}
errors++;
}
}
}
else {
const err205 = {instancePath:instancePath+"/report_data/full_forensic_record/document_stack_redline",schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/document_stack_redline/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err205];
}
else {
vErrors.push(err205);
}
errors++;
}
}
if(data94.triggered_findings !== undefined){
let data102 = data94.triggered_findings;
if(Array.isArray(data102)){
const len19 = data102.length;
for(let i19=0; i19<len19; i19++){
let data103 = data102[i19];
if(data103 && typeof data103 == "object" && !Array.isArray(data103)){
if(data103.finding_id === undefined){
const err206 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "finding_id"},message:"must have required property '"+"finding_id"+"'"};
if(vErrors === null){
vErrors = [err206];
}
else {
vErrors.push(err206);
}
errors++;
}
if(data103.threat_id === undefined){
const err207 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "threat_id"},message:"must have required property '"+"threat_id"+"'"};
if(vErrors === null){
vErrors = [err207];
}
else {
vErrors.push(err207);
}
errors++;
}
if(data103.threat_name === undefined){
const err208 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "threat_name"},message:"must have required property '"+"threat_name"+"'"};
if(vErrors === null){
vErrors = [err208];
}
else {
vErrors.push(err208);
}
errors++;
}
if(data103.status === undefined){
const err209 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err209];
}
else {
vErrors.push(err209);
}
errors++;
}
if(data103.pain_tier === undefined){
const err210 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "pain_tier"},message:"must have required property '"+"pain_tier"+"'"};
if(vErrors === null){
vErrors = [err210];
}
else {
vErrors.push(err210);
}
errors++;
}
if(data103.pain_category === undefined){
const err211 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "pain_category"},message:"must have required property '"+"pain_category"+"'"};
if(vErrors === null){
vErrors = [err211];
}
else {
vErrors.push(err211);
}
errors++;
}
if(data103.pain_depth === undefined){
const err212 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "pain_depth"},message:"must have required property '"+"pain_depth"+"'"};
if(vErrors === null){
vErrors = [err212];
}
else {
vErrors.push(err212);
}
errors++;
}
if(data103.lane === undefined){
const err213 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "lane"},message:"must have required property '"+"lane"+"'"};
if(vErrors === null){
vErrors = [err213];
}
else {
vErrors.push(err213);
}
errors++;
}
if(data103.archetype === undefined){
const err214 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "archetype"},message:"must have required property '"+"archetype"+"'"};
if(vErrors === null){
vErrors = [err214];
}
else {
vErrors.push(err214);
}
errors++;
}
if(data103.surface_tokens === undefined){
const err215 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "surface_tokens"},message:"must have required property '"+"surface_tokens"+"'"};
if(vErrors === null){
vErrors = [err215];
}
else {
vErrors.push(err215);
}
errors++;
}
if(data103.subcat === undefined){
const err216 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "subcat"},message:"must have required property '"+"subcat"+"'"};
if(vErrors === null){
vErrors = [err216];
}
else {
vErrors.push(err216);
}
errors++;
}
if(data103.authority === undefined){
const err217 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "authority"},message:"must have required property '"+"authority"+"'"};
if(vErrors === null){
vErrors = [err217];
}
else {
vErrors.push(err217);
}
errors++;
}
if(data103.linked_feature_ids === undefined){
const err218 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "linked_feature_ids"},message:"must have required property '"+"linked_feature_ids"+"'"};
if(vErrors === null){
vErrors = [err218];
}
else {
vErrors.push(err218);
}
errors++;
}
if(data103.evidence === undefined){
const err219 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "evidence"},message:"must have required property '"+"evidence"+"'"};
if(vErrors === null){
vErrors = [err219];
}
else {
vErrors.push(err219);
}
errors++;
}
if(data103.trigger_evaluation === undefined){
const err220 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "trigger_evaluation"},message:"must have required property '"+"trigger_evaluation"+"'"};
if(vErrors === null){
vErrors = [err220];
}
else {
vErrors.push(err220);
}
errors++;
}
if(data103.registry_payload === undefined){
const err221 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "registry_payload"},message:"must have required property '"+"registry_payload"+"'"};
if(vErrors === null){
vErrors = [err221];
}
else {
vErrors.push(err221);
}
errors++;
}
if(data103.redline_route === undefined){
const err222 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "redline_route"},message:"must have required property '"+"redline_route"+"'"};
if(vErrors === null){
vErrors = [err222];
}
else {
vErrors.push(err222);
}
errors++;
}
if(data103.document_routes === undefined){
const err223 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "document_routes"},message:"must have required property '"+"document_routes"+"'"};
if(vErrors === null){
vErrors = [err223];
}
else {
vErrors.push(err223);
}
errors++;
}
if(data103.vault_dependencies === undefined){
const err224 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "vault_dependencies"},message:"must have required property '"+"vault_dependencies"+"'"};
if(vErrors === null){
vErrors = [err224];
}
else {
vErrors.push(err224);
}
errors++;
}
if(data103.finding_memo_note === undefined){
const err225 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19,schemaPath:"#/$defs/finding/required",keyword:"required",params:{missingProperty: "finding_memo_note"},message:"must have required property '"+"finding_memo_note"+"'"};
if(vErrors === null){
vErrors = [err225];
}
else {
vErrors.push(err225);
}
errors++;
}
for(const key10 in data103){
if(!(func1.call(schema68.properties, key10))){
const err226 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19,schemaPath:"#/$defs/finding/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key10},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err226];
}
else {
vErrors.push(err226);
}
errors++;
}
}
if(data103.finding_id !== undefined){
if(typeof data103.finding_id !== "string"){
const err227 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/finding_id",schemaPath:"#/$defs/finding/properties/finding_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err227];
}
else {
vErrors.push(err227);
}
errors++;
}
}
if(data103.threat_id !== undefined){
if(typeof data103.threat_id !== "string"){
const err228 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/threat_id",schemaPath:"#/$defs/finding/properties/threat_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err228];
}
else {
vErrors.push(err228);
}
errors++;
}
}
if(data103.threat_name !== undefined){
if(typeof data103.threat_name !== "string"){
const err229 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/threat_name",schemaPath:"#/$defs/finding/properties/threat_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err229];
}
else {
vErrors.push(err229);
}
errors++;
}
}
if(data103.status !== undefined){
if("TRIGGERED" !== data103.status){
const err230 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/status",schemaPath:"#/$defs/finding/properties/status/const",keyword:"const",params:{allowedValue: "TRIGGERED"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err230];
}
else {
vErrors.push(err230);
}
errors++;
}
}
if(data103.pain_tier !== undefined){
if(typeof data103.pain_tier !== "string"){
const err231 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/pain_tier",schemaPath:"#/$defs/finding/properties/pain_tier/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err231];
}
else {
vErrors.push(err231);
}
errors++;
}
}
if(data103.pain_category !== undefined){
if(typeof data103.pain_category !== "string"){
const err232 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/pain_category",schemaPath:"#/$defs/finding/properties/pain_category/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err232];
}
else {
vErrors.push(err232);
}
errors++;
}
}
if(data103.pain_depth !== undefined){
if(typeof data103.pain_depth !== "string"){
const err233 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/pain_depth",schemaPath:"#/$defs/finding/properties/pain_depth/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err233];
}
else {
vErrors.push(err233);
}
errors++;
}
}
if(data103.lane !== undefined){
if(typeof data103.lane !== "string"){
const err234 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/lane",schemaPath:"#/$defs/finding/properties/lane/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err234];
}
else {
vErrors.push(err234);
}
errors++;
}
}
if(data103.archetype !== undefined){
if(typeof data103.archetype !== "string"){
const err235 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/archetype",schemaPath:"#/$defs/finding/properties/archetype/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err235];
}
else {
vErrors.push(err235);
}
errors++;
}
}
if(data103.surface_tokens !== undefined){
let data113 = data103.surface_tokens;
if(Array.isArray(data113)){
const len20 = data113.length;
for(let i20=0; i20<len20; i20++){
if(typeof data113[i20] !== "string"){
const err236 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/surface_tokens/" + i20,schemaPath:"#/$defs/finding/properties/surface_tokens/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err236];
}
else {
vErrors.push(err236);
}
errors++;
}
}
}
else {
const err237 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/surface_tokens",schemaPath:"#/$defs/finding/properties/surface_tokens/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err237];
}
else {
vErrors.push(err237);
}
errors++;
}
}
if(data103.subcat !== undefined){
if(typeof data103.subcat !== "string"){
const err238 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/subcat",schemaPath:"#/$defs/finding/properties/subcat/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err238];
}
else {
vErrors.push(err238);
}
errors++;
}
}
if(data103.authority !== undefined){
if(typeof data103.authority !== "string"){
const err239 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/authority",schemaPath:"#/$defs/finding/properties/authority/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err239];
}
else {
vErrors.push(err239);
}
errors++;
}
}
if(data103.linked_feature_ids !== undefined){
let data117 = data103.linked_feature_ids;
if(Array.isArray(data117)){
const len21 = data117.length;
for(let i21=0; i21<len21; i21++){
if(typeof data117[i21] !== "string"){
const err240 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/linked_feature_ids/" + i21,schemaPath:"#/$defs/finding/properties/linked_feature_ids/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err240];
}
else {
vErrors.push(err240);
}
errors++;
}
}
}
else {
const err241 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/linked_feature_ids",schemaPath:"#/$defs/finding/properties/linked_feature_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err241];
}
else {
vErrors.push(err241);
}
errors++;
}
}
if(data103.evidence !== undefined){
let data119 = data103.evidence;
if(data119 && typeof data119 == "object" && !Array.isArray(data119)){
if(data119.source_url === undefined){
const err242 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/evidence",schemaPath:"#/$defs/finding/properties/evidence/required",keyword:"required",params:{missingProperty: "source_url"},message:"must have required property '"+"source_url"+"'"};
if(vErrors === null){
vErrors = [err242];
}
else {
vErrors.push(err242);
}
errors++;
}
if(data119.artifact_class === undefined){
const err243 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/evidence",schemaPath:"#/$defs/finding/properties/evidence/required",keyword:"required",params:{missingProperty: "artifact_class"},message:"must have required property '"+"artifact_class"+"'"};
if(vErrors === null){
vErrors = [err243];
}
else {
vErrors.push(err243);
}
errors++;
}
if(data119.proof_citation === undefined){
const err244 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/evidence",schemaPath:"#/$defs/finding/properties/evidence/required",keyword:"required",params:{missingProperty: "proof_citation"},message:"must have required property '"+"proof_citation"+"'"};
if(vErrors === null){
vErrors = [err244];
}
else {
vErrors.push(err244);
}
errors++;
}
if(data119.evidence_mode === undefined){
const err245 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/evidence",schemaPath:"#/$defs/finding/properties/evidence/required",keyword:"required",params:{missingProperty: "evidence_mode"},message:"must have required property '"+"evidence_mode"+"'"};
if(vErrors === null){
vErrors = [err245];
}
else {
vErrors.push(err245);
}
errors++;
}
if(data119.source_hash === undefined){
const err246 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/evidence",schemaPath:"#/$defs/finding/properties/evidence/required",keyword:"required",params:{missingProperty: "source_hash"},message:"must have required property '"+"source_hash"+"'"};
if(vErrors === null){
vErrors = [err246];
}
else {
vErrors.push(err246);
}
errors++;
}
if(data119.extracted_excerpt === undefined){
const err247 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/evidence",schemaPath:"#/$defs/finding/properties/evidence/required",keyword:"required",params:{missingProperty: "extracted_excerpt"},message:"must have required property '"+"extracted_excerpt"+"'"};
if(vErrors === null){
vErrors = [err247];
}
else {
vErrors.push(err247);
}
errors++;
}
for(const key11 in data119){
if(!((((((key11 === "source_url") || (key11 === "artifact_class")) || (key11 === "proof_citation")) || (key11 === "evidence_mode")) || (key11 === "source_hash")) || (key11 === "extracted_excerpt"))){
const err248 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/evidence",schemaPath:"#/$defs/finding/properties/evidence/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key11},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err248];
}
else {
vErrors.push(err248);
}
errors++;
}
}
if(data119.source_url !== undefined){
if(typeof data119.source_url !== "string"){
const err249 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/evidence/source_url",schemaPath:"#/$defs/finding/properties/evidence/properties/source_url/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err249];
}
else {
vErrors.push(err249);
}
errors++;
}
}
if(data119.artifact_class !== undefined){
if(typeof data119.artifact_class !== "string"){
const err250 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/evidence/artifact_class",schemaPath:"#/$defs/finding/properties/evidence/properties/artifact_class/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err250];
}
else {
vErrors.push(err250);
}
errors++;
}
}
if(data119.proof_citation !== undefined){
if(typeof data119.proof_citation !== "string"){
const err251 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/evidence/proof_citation",schemaPath:"#/$defs/finding/properties/evidence/properties/proof_citation/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err251];
}
else {
vErrors.push(err251);
}
errors++;
}
}
if(data119.evidence_mode !== undefined){
if(typeof data119.evidence_mode !== "string"){
const err252 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/evidence/evidence_mode",schemaPath:"#/$defs/finding/properties/evidence/properties/evidence_mode/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err252];
}
else {
vErrors.push(err252);
}
errors++;
}
}
if(data119.source_hash !== undefined){
if(typeof data119.source_hash !== "string"){
const err253 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/evidence/source_hash",schemaPath:"#/$defs/finding/properties/evidence/properties/source_hash/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err253];
}
else {
vErrors.push(err253);
}
errors++;
}
}
if(data119.extracted_excerpt !== undefined){
if(typeof data119.extracted_excerpt !== "string"){
const err254 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/evidence/extracted_excerpt",schemaPath:"#/$defs/finding/properties/evidence/properties/extracted_excerpt/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err254];
}
else {
vErrors.push(err254);
}
errors++;
}
}
}
else {
const err255 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/evidence",schemaPath:"#/$defs/finding/properties/evidence/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err255];
}
else {
vErrors.push(err255);
}
errors++;
}
}
if(data103.trigger_evaluation !== undefined){
let data126 = data103.trigger_evaluation;
if(data126 && typeof data126 == "object" && !Array.isArray(data126)){
if(data126.conditions_passed === undefined){
const err256 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/trigger_evaluation",schemaPath:"#/$defs/finding/properties/trigger_evaluation/required",keyword:"required",params:{missingProperty: "conditions_passed"},message:"must have required property '"+"conditions_passed"+"'"};
if(vErrors === null){
vErrors = [err256];
}
else {
vErrors.push(err256);
}
errors++;
}
if(data126.conditions_failed === undefined){
const err257 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/trigger_evaluation",schemaPath:"#/$defs/finding/properties/trigger_evaluation/required",keyword:"required",params:{missingProperty: "conditions_failed"},message:"must have required property '"+"conditions_failed"+"'"};
if(vErrors === null){
vErrors = [err257];
}
else {
vErrors.push(err257);
}
errors++;
}
if(data126.trigger_if_result === undefined){
const err258 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/trigger_evaluation",schemaPath:"#/$defs/finding/properties/trigger_evaluation/required",keyword:"required",params:{missingProperty: "trigger_if_result"},message:"must have required property '"+"trigger_if_result"+"'"};
if(vErrors === null){
vErrors = [err258];
}
else {
vErrors.push(err258);
}
errors++;
}
if(data126.exclude_if_result === undefined){
const err259 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/trigger_evaluation",schemaPath:"#/$defs/finding/properties/trigger_evaluation/required",keyword:"required",params:{missingProperty: "exclude_if_result"},message:"must have required property '"+"exclude_if_result"+"'"};
if(vErrors === null){
vErrors = [err259];
}
else {
vErrors.push(err259);
}
errors++;
}
if(data126.exclude_if_basis === undefined){
const err260 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/trigger_evaluation",schemaPath:"#/$defs/finding/properties/trigger_evaluation/required",keyword:"required",params:{missingProperty: "exclude_if_basis"},message:"must have required property '"+"exclude_if_basis"+"'"};
if(vErrors === null){
vErrors = [err260];
}
else {
vErrors.push(err260);
}
errors++;
}
for(const key12 in data126){
if(!(((((key12 === "conditions_passed") || (key12 === "conditions_failed")) || (key12 === "trigger_if_result")) || (key12 === "exclude_if_result")) || (key12 === "exclude_if_basis"))){
const err261 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/trigger_evaluation",schemaPath:"#/$defs/finding/properties/trigger_evaluation/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key12},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err261];
}
else {
vErrors.push(err261);
}
errors++;
}
}
if(data126.conditions_passed !== undefined){
let data127 = data126.conditions_passed;
if(Array.isArray(data127)){
const len22 = data127.length;
for(let i22=0; i22<len22; i22++){
if(typeof data127[i22] !== "string"){
const err262 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/trigger_evaluation/conditions_passed/" + i22,schemaPath:"#/$defs/finding/properties/trigger_evaluation/properties/conditions_passed/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err262];
}
else {
vErrors.push(err262);
}
errors++;
}
}
}
else {
const err263 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/trigger_evaluation/conditions_passed",schemaPath:"#/$defs/finding/properties/trigger_evaluation/properties/conditions_passed/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err263];
}
else {
vErrors.push(err263);
}
errors++;
}
}
if(data126.conditions_failed !== undefined){
let data129 = data126.conditions_failed;
if(Array.isArray(data129)){
const len23 = data129.length;
for(let i23=0; i23<len23; i23++){
if(typeof data129[i23] !== "string"){
const err264 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/trigger_evaluation/conditions_failed/" + i23,schemaPath:"#/$defs/finding/properties/trigger_evaluation/properties/conditions_failed/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err264];
}
else {
vErrors.push(err264);
}
errors++;
}
}
}
else {
const err265 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/trigger_evaluation/conditions_failed",schemaPath:"#/$defs/finding/properties/trigger_evaluation/properties/conditions_failed/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err265];
}
else {
vErrors.push(err265);
}
errors++;
}
}
if(data126.trigger_if_result !== undefined){
if(typeof data126.trigger_if_result !== "boolean"){
const err266 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/trigger_evaluation/trigger_if_result",schemaPath:"#/$defs/finding/properties/trigger_evaluation/properties/trigger_if_result/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err266];
}
else {
vErrors.push(err266);
}
errors++;
}
}
if(data126.exclude_if_result !== undefined){
if(typeof data126.exclude_if_result !== "boolean"){
const err267 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/trigger_evaluation/exclude_if_result",schemaPath:"#/$defs/finding/properties/trigger_evaluation/properties/exclude_if_result/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err267];
}
else {
vErrors.push(err267);
}
errors++;
}
}
if(data126.exclude_if_basis !== undefined){
if(typeof data126.exclude_if_basis !== "string"){
const err268 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/trigger_evaluation/exclude_if_basis",schemaPath:"#/$defs/finding/properties/trigger_evaluation/properties/exclude_if_basis/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err268];
}
else {
vErrors.push(err268);
}
errors++;
}
}
}
else {
const err269 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/trigger_evaluation",schemaPath:"#/$defs/finding/properties/trigger_evaluation/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err269];
}
else {
vErrors.push(err269);
}
errors++;
}
}
if(data103.registry_payload !== undefined){
let data134 = data103.registry_payload;
if(data134 && typeof data134 == "object" && !Array.isArray(data134)){
if(data134.legal_pain === undefined){
const err270 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/registry_payload",schemaPath:"#/$defs/finding/properties/registry_payload/required",keyword:"required",params:{missingProperty: "legal_pain"},message:"must have required property '"+"legal_pain"+"'"};
if(vErrors === null){
vErrors = [err270];
}
else {
vErrors.push(err270);
}
errors++;
}
if(data134.fp_mechanism === undefined){
const err271 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/registry_payload",schemaPath:"#/$defs/finding/properties/registry_payload/required",keyword:"required",params:{missingProperty: "fp_mechanism"},message:"must have required property '"+"fp_mechanism"+"'"};
if(vErrors === null){
vErrors = [err271];
}
else {
vErrors.push(err271);
}
errors++;
}
if(data134.fp_impact === undefined){
const err272 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/registry_payload",schemaPath:"#/$defs/finding/properties/registry_payload/required",keyword:"required",params:{missingProperty: "fp_impact"},message:"must have required property '"+"fp_impact"+"'"};
if(vErrors === null){
vErrors = [err272];
}
else {
vErrors.push(err272);
}
errors++;
}
if(data134.lex_nova_fix === undefined){
const err273 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/registry_payload",schemaPath:"#/$defs/finding/properties/registry_payload/required",keyword:"required",params:{missingProperty: "lex_nova_fix"},message:"must have required property '"+"lex_nova_fix"+"'"};
if(vErrors === null){
vErrors = [err273];
}
else {
vErrors.push(err273);
}
errors++;
}
for(const key13 in data134){
if(!((((key13 === "legal_pain") || (key13 === "fp_mechanism")) || (key13 === "fp_impact")) || (key13 === "lex_nova_fix"))){
const err274 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/registry_payload",schemaPath:"#/$defs/finding/properties/registry_payload/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key13},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err274];
}
else {
vErrors.push(err274);
}
errors++;
}
}
if(data134.legal_pain !== undefined){
if(typeof data134.legal_pain !== "string"){
const err275 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/registry_payload/legal_pain",schemaPath:"#/$defs/finding/properties/registry_payload/properties/legal_pain/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err275];
}
else {
vErrors.push(err275);
}
errors++;
}
}
if(data134.fp_mechanism !== undefined){
if(typeof data134.fp_mechanism !== "string"){
const err276 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/registry_payload/fp_mechanism",schemaPath:"#/$defs/finding/properties/registry_payload/properties/fp_mechanism/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err276];
}
else {
vErrors.push(err276);
}
errors++;
}
}
if(data134.fp_impact !== undefined){
if(typeof data134.fp_impact !== "string"){
const err277 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/registry_payload/fp_impact",schemaPath:"#/$defs/finding/properties/registry_payload/properties/fp_impact/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err277];
}
else {
vErrors.push(err277);
}
errors++;
}
}
if(data134.lex_nova_fix !== undefined){
if(typeof data134.lex_nova_fix !== "string"){
const err278 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/registry_payload/lex_nova_fix",schemaPath:"#/$defs/finding/properties/registry_payload/properties/lex_nova_fix/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err278];
}
else {
vErrors.push(err278);
}
errors++;
}
}
}
else {
const err279 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/registry_payload",schemaPath:"#/$defs/finding/properties/registry_payload/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err279];
}
else {
vErrors.push(err279);
}
errors++;
}
}
if(data103.redline_route !== undefined){
let data139 = data103.redline_route;
if(Array.isArray(data139)){
const len24 = data139.length;
for(let i24=0; i24<len24; i24++){
if(typeof data139[i24] !== "string"){
const err280 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/redline_route/" + i24,schemaPath:"#/$defs/finding/properties/redline_route/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err280];
}
else {
vErrors.push(err280);
}
errors++;
}
}
}
else {
const err281 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/redline_route",schemaPath:"#/$defs/finding/properties/redline_route/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err281];
}
else {
vErrors.push(err281);
}
errors++;
}
}
if(data103.document_routes !== undefined){
let data141 = data103.document_routes;
if(Array.isArray(data141)){
const len25 = data141.length;
for(let i25=0; i25<len25; i25++){
if(typeof data141[i25] !== "string"){
const err282 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/document_routes/" + i25,schemaPath:"#/$defs/finding/properties/document_routes/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err282];
}
else {
vErrors.push(err282);
}
errors++;
}
}
}
else {
const err283 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/document_routes",schemaPath:"#/$defs/finding/properties/document_routes/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err283];
}
else {
vErrors.push(err283);
}
errors++;
}
}
if(data103.vault_dependencies !== undefined){
let data143 = data103.vault_dependencies;
if(Array.isArray(data143)){
const len26 = data143.length;
for(let i26=0; i26<len26; i26++){
if(typeof data143[i26] !== "string"){
const err284 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/vault_dependencies/" + i26,schemaPath:"#/$defs/finding/properties/vault_dependencies/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err284];
}
else {
vErrors.push(err284);
}
errors++;
}
}
}
else {
const err285 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/vault_dependencies",schemaPath:"#/$defs/finding/properties/vault_dependencies/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err285];
}
else {
vErrors.push(err285);
}
errors++;
}
}
if(data103.finding_memo_note !== undefined){
if(typeof data103.finding_memo_note !== "string"){
const err286 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19+"/finding_memo_note",schemaPath:"#/$defs/finding/properties/finding_memo_note/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err286];
}
else {
vErrors.push(err286);
}
errors++;
}
}
}
else {
const err287 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings/" + i19,schemaPath:"#/$defs/finding/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err287];
}
else {
vErrors.push(err287);
}
errors++;
}
}
}
else {
const err288 = {instancePath:instancePath+"/report_data/full_forensic_record/triggered_findings",schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/triggered_findings/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err288];
}
else {
vErrors.push(err288);
}
errors++;
}
}
if(data94.controlled_rows !== undefined){
let data146 = data94.controlled_rows;
if(Array.isArray(data146)){
const len27 = data146.length;
for(let i27=0; i27<len27; i27++){
let data147 = data146[i27];
if(data147 && typeof data147 == "object" && !Array.isArray(data147)){
if(data147.threat_id === undefined){
const err289 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i27,schemaPath:"#/$defs/statusRow/required",keyword:"required",params:{missingProperty: "threat_id"},message:"must have required property '"+"threat_id"+"'"};
if(vErrors === null){
vErrors = [err289];
}
else {
vErrors.push(err289);
}
errors++;
}
if(data147.threat_name === undefined){
const err290 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i27,schemaPath:"#/$defs/statusRow/required",keyword:"required",params:{missingProperty: "threat_name"},message:"must have required property '"+"threat_name"+"'"};
if(vErrors === null){
vErrors = [err290];
}
else {
vErrors.push(err290);
}
errors++;
}
if(data147.status === undefined){
const err291 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i27,schemaPath:"#/$defs/statusRow/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err291];
}
else {
vErrors.push(err291);
}
errors++;
}
if(data147.reasoning_summary === undefined){
const err292 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i27,schemaPath:"#/$defs/statusRow/required",keyword:"required",params:{missingProperty: "reasoning_summary"},message:"must have required property '"+"reasoning_summary"+"'"};
if(vErrors === null){
vErrors = [err292];
}
else {
vErrors.push(err292);
}
errors++;
}
if(data147.threat_id !== undefined){
if(typeof data147.threat_id !== "string"){
const err293 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i27+"/threat_id",schemaPath:"#/$defs/statusRow/properties/threat_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err293];
}
else {
vErrors.push(err293);
}
errors++;
}
}
if(data147.threat_name !== undefined){
if(typeof data147.threat_name !== "string"){
const err294 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i27+"/threat_name",schemaPath:"#/$defs/statusRow/properties/threat_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err294];
}
else {
vErrors.push(err294);
}
errors++;
}
}
if(data147.status !== undefined){
let data150 = data147.status;
if(typeof data150 !== "string"){
const err295 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i27+"/status",schemaPath:"#/$defs/statusRow/properties/status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err295];
}
else {
vErrors.push(err295);
}
errors++;
}
if(!((data150 === "CONTROLLED") || (data150 === "INSUFFICIENT_EVIDENCE"))){
const err296 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i27+"/status",schemaPath:"#/$defs/statusRow/properties/status/enum",keyword:"enum",params:{allowedValues: schema69.properties.status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err296];
}
else {
vErrors.push(err296);
}
errors++;
}
}
if(data147.reasoning_summary !== undefined){
if(typeof data147.reasoning_summary !== "string"){
const err297 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i27+"/reasoning_summary",schemaPath:"#/$defs/statusRow/properties/reasoning_summary/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err297];
}
else {
vErrors.push(err297);
}
errors++;
}
}
}
else {
const err298 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows/" + i27,schemaPath:"#/$defs/statusRow/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err298];
}
else {
vErrors.push(err298);
}
errors++;
}
}
}
else {
const err299 = {instancePath:instancePath+"/report_data/full_forensic_record/controlled_rows",schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/controlled_rows/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err299];
}
else {
vErrors.push(err299);
}
errors++;
}
}
if(data94.insufficient_evidence_rows !== undefined){
let data152 = data94.insufficient_evidence_rows;
if(Array.isArray(data152)){
const len28 = data152.length;
for(let i28=0; i28<len28; i28++){
let data153 = data152[i28];
if(data153 && typeof data153 == "object" && !Array.isArray(data153)){
if(data153.threat_id === undefined){
const err300 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i28,schemaPath:"#/$defs/statusRow/required",keyword:"required",params:{missingProperty: "threat_id"},message:"must have required property '"+"threat_id"+"'"};
if(vErrors === null){
vErrors = [err300];
}
else {
vErrors.push(err300);
}
errors++;
}
if(data153.threat_name === undefined){
const err301 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i28,schemaPath:"#/$defs/statusRow/required",keyword:"required",params:{missingProperty: "threat_name"},message:"must have required property '"+"threat_name"+"'"};
if(vErrors === null){
vErrors = [err301];
}
else {
vErrors.push(err301);
}
errors++;
}
if(data153.status === undefined){
const err302 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i28,schemaPath:"#/$defs/statusRow/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err302];
}
else {
vErrors.push(err302);
}
errors++;
}
if(data153.reasoning_summary === undefined){
const err303 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i28,schemaPath:"#/$defs/statusRow/required",keyword:"required",params:{missingProperty: "reasoning_summary"},message:"must have required property '"+"reasoning_summary"+"'"};
if(vErrors === null){
vErrors = [err303];
}
else {
vErrors.push(err303);
}
errors++;
}
if(data153.threat_id !== undefined){
if(typeof data153.threat_id !== "string"){
const err304 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i28+"/threat_id",schemaPath:"#/$defs/statusRow/properties/threat_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err304];
}
else {
vErrors.push(err304);
}
errors++;
}
}
if(data153.threat_name !== undefined){
if(typeof data153.threat_name !== "string"){
const err305 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i28+"/threat_name",schemaPath:"#/$defs/statusRow/properties/threat_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err305];
}
else {
vErrors.push(err305);
}
errors++;
}
}
if(data153.status !== undefined){
let data156 = data153.status;
if(typeof data156 !== "string"){
const err306 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i28+"/status",schemaPath:"#/$defs/statusRow/properties/status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err306];
}
else {
vErrors.push(err306);
}
errors++;
}
if(!((data156 === "CONTROLLED") || (data156 === "INSUFFICIENT_EVIDENCE"))){
const err307 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i28+"/status",schemaPath:"#/$defs/statusRow/properties/status/enum",keyword:"enum",params:{allowedValues: schema69.properties.status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err307];
}
else {
vErrors.push(err307);
}
errors++;
}
}
if(data153.reasoning_summary !== undefined){
if(typeof data153.reasoning_summary !== "string"){
const err308 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i28+"/reasoning_summary",schemaPath:"#/$defs/statusRow/properties/reasoning_summary/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err308];
}
else {
vErrors.push(err308);
}
errors++;
}
}
}
else {
const err309 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows/" + i28,schemaPath:"#/$defs/statusRow/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err309];
}
else {
vErrors.push(err309);
}
errors++;
}
}
}
else {
const err310 = {instancePath:instancePath+"/report_data/full_forensic_record/insufficient_evidence_rows",schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/insufficient_evidence_rows/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err310];
}
else {
vErrors.push(err310);
}
errors++;
}
}
if(data94.assembly_route !== undefined){
let data158 = data94.assembly_route;
if(data158 && typeof data158 == "object" && !Array.isArray(data158)){
}
else {
const err311 = {instancePath:instancePath+"/report_data/full_forensic_record/assembly_route",schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/assembly_route/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err311];
}
else {
vErrors.push(err311);
}
errors++;
}
}
if(data94.technical_audit_log !== undefined){
let data159 = data94.technical_audit_log;
if(Array.isArray(data159)){
const len29 = data159.length;
for(let i29=0; i29<len29; i29++){
let data160 = data159[i29];
if(data160 && typeof data160 == "object" && !Array.isArray(data160)){
}
else {
const err312 = {instancePath:instancePath+"/report_data/full_forensic_record/technical_audit_log/" + i29,schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/technical_audit_log/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err312];
}
else {
vErrors.push(err312);
}
errors++;
}
}
}
else {
const err313 = {instancePath:instancePath+"/report_data/full_forensic_record/technical_audit_log",schemaPath:"#/properties/report_data/properties/full_forensic_record/properties/technical_audit_log/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err313];
}
else {
vErrors.push(err313);
}
errors++;
}
}
}
else {
const err314 = {instancePath:instancePath+"/report_data/full_forensic_record",schemaPath:"#/properties/report_data/properties/full_forensic_record/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err314];
}
else {
vErrors.push(err314);
}
errors++;
}
}
}
else {
const err315 = {instancePath:instancePath+"/report_data",schemaPath:"#/properties/report_data/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err315];
}
else {
vErrors.push(err315);
}
errors++;
}
}
if(data.technical_audit_log !== undefined){
let data161 = data.technical_audit_log;
if(Array.isArray(data161)){
const len30 = data161.length;
for(let i30=0; i30<len30; i30++){
let data162 = data161[i30];
if(data162 && typeof data162 == "object" && !Array.isArray(data162)){
}
else {
const err316 = {instancePath:instancePath+"/technical_audit_log/" + i30,schemaPath:"#/properties/technical_audit_log/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err316];
}
else {
vErrors.push(err316);
}
errors++;
}
}
}
else {
const err317 = {instancePath:instancePath+"/technical_audit_log",schemaPath:"#/properties/technical_audit_log/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err317];
}
else {
vErrors.push(err317);
}
errors++;
}
}
if(data.assembly_route !== undefined){
let data163 = data.assembly_route;
if(data163 && typeof data163 == "object" && !Array.isArray(data163)){
}
else {
const err318 = {instancePath:instancePath+"/assembly_route",schemaPath:"#/properties/assembly_route/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err318];
}
else {
vErrors.push(err318);
}
errors++;
}
}
if(data.assembly_handoff !== undefined){
let data164 = data.assembly_handoff;
if(data164 && typeof data164 == "object" && !Array.isArray(data164)){
}
else {
const err319 = {instancePath:instancePath+"/assembly_handoff",schemaPath:"#/properties/assembly_handoff/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err319];
}
else {
vErrors.push(err319);
}
errors++;
}
}
if(data.handoff_envelope !== undefined){
let data165 = data.handoff_envelope;
if(data165 && typeof data165 == "object" && !Array.isArray(data165)){
}
else {
const err320 = {instancePath:instancePath+"/handoff_envelope",schemaPath:"#/properties/handoff_envelope/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err320];
}
else {
vErrors.push(err320);
}
errors++;
}
}
if(data.disclaimer !== undefined){
if(typeof data.disclaimer !== "string"){
const err321 = {instancePath:instancePath+"/disclaimer",schemaPath:"#/properties/disclaimer/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err321];
}
else {
vErrors.push(err321);
}
errors++;
}
}
}
else {
const err322 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err322];
}
else {
vErrors.push(err322);
}
errors++;
}
validate42.errors = vErrors;
return errors === 0;
}
validate42.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

export const validate_assemblyOutput = validate43;
const schema74 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://interface-sandbox.local/schemas/assemblyOutput.schema.json","title":"Assembly Handoff Payload","description":"Canonical assembly_handoff_payload for Diligence to Assembly. Vault prefill may contain only fields allowed by the Vault Canonical Map.","type":"object","required":["handoff_meta","target_profile","feature_map","threat_findings","document_stack_status","vault_prefill_suggestions","vault_confirmation_questions","assembly_route_recommendation","warnings"],"additionalProperties":false,"properties":{"handoff_meta":{"type":"object","required":["run_id","created_at","source_engine","target_engine"],"additionalProperties":true,"properties":{"run_id":{"type":"string"},"created_at":{"type":"string","format":"date-time"},"source_engine":{"const":"diligence"},"target_engine":{"const":"assembly"}}},"target_profile":{"type":"object","additionalProperties":true},"feature_map":{"type":"array","items":{"type":"object","additionalProperties":true}},"threat_findings":{"type":"array","items":{"type":"object","additionalProperties":true}},"document_stack_status":{"type":"array","items":{"type":"object","additionalProperties":true}},"vault_prefill_suggestions":{"type":"object","required":["baseline","architecture","archetypes","compliance"],"additionalProperties":false,"properties":{"baseline":{"$ref":"#/$defs/prefillGroup"},"architecture":{"$ref":"#/$defs/prefillGroup"},"archetypes":{"$ref":"#/$defs/prefillGroup"},"compliance":{"$ref":"#/$defs/prefillGroup"}}},"vault_confirmation_questions":{"type":"array","items":{"type":"object","required":["field_path","question","why_it_matters","source_context","required_for"],"additionalProperties":false,"properties":{"field_path":{"type":"string"},"question":{"type":"string"},"why_it_matters":{"type":"string"},"source_context":{"type":"string"},"required_for":{"type":"string"}}}},"assembly_route_recommendation":{"type":"object","additionalProperties":true},"warnings":{"type":"array","items":{"type":"string"}}},"$defs":{"prefillSuggestion":{"type":"object","required":["value","basis","confidence","source_finding_ids"],"additionalProperties":false,"properties":{"value":{},"basis":{"type":"string"},"confidence":{"type":"string","enum":["high","medium","low"]},"source_finding_ids":{"type":"array","items":{"type":"string"}}}},"prefillGroup":{"type":"object","description":"Only fields allowed by VAULT_JS_CANONICAL_MAP_v1.md may appear here.","additionalProperties":{"$ref":"#/$defs/prefillSuggestion"}}}};
const schema75 = {"type":"object","description":"Only fields allowed by VAULT_JS_CANONICAL_MAP_v1.md may appear here.","additionalProperties":{"$ref":"#/$defs/prefillSuggestion"}};
const schema76 = {"type":"object","required":["value","basis","confidence","source_finding_ids"],"additionalProperties":false,"properties":{"value":{},"basis":{"type":"string"},"confidence":{"type":"string","enum":["high","medium","low"]},"source_finding_ids":{"type":"array","items":{"type":"string"}}}};

function validate44(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate44.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
for(const key0 in data){
let data0 = data[key0];
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
if(data0.value === undefined){
const err0 = {instancePath:instancePath+"/" + key0.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/$defs/prefillSuggestion/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data0.basis === undefined){
const err1 = {instancePath:instancePath+"/" + key0.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/$defs/prefillSuggestion/required",keyword:"required",params:{missingProperty: "basis"},message:"must have required property '"+"basis"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data0.confidence === undefined){
const err2 = {instancePath:instancePath+"/" + key0.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/$defs/prefillSuggestion/required",keyword:"required",params:{missingProperty: "confidence"},message:"must have required property '"+"confidence"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data0.source_finding_ids === undefined){
const err3 = {instancePath:instancePath+"/" + key0.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/$defs/prefillSuggestion/required",keyword:"required",params:{missingProperty: "source_finding_ids"},message:"must have required property '"+"source_finding_ids"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key1 in data0){
if(!((((key1 === "value") || (key1 === "basis")) || (key1 === "confidence")) || (key1 === "source_finding_ids"))){
const err4 = {instancePath:instancePath+"/" + key0.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/$defs/prefillSuggestion/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data0.basis !== undefined){
if(typeof data0.basis !== "string"){
const err5 = {instancePath:instancePath+"/" + key0.replace(/~/g, "~0").replace(/\//g, "~1")+"/basis",schemaPath:"#/$defs/prefillSuggestion/properties/basis/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data0.confidence !== undefined){
let data2 = data0.confidence;
if(typeof data2 !== "string"){
const err6 = {instancePath:instancePath+"/" + key0.replace(/~/g, "~0").replace(/\//g, "~1")+"/confidence",schemaPath:"#/$defs/prefillSuggestion/properties/confidence/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!(((data2 === "high") || (data2 === "medium")) || (data2 === "low"))){
const err7 = {instancePath:instancePath+"/" + key0.replace(/~/g, "~0").replace(/\//g, "~1")+"/confidence",schemaPath:"#/$defs/prefillSuggestion/properties/confidence/enum",keyword:"enum",params:{allowedValues: schema76.properties.confidence.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data0.source_finding_ids !== undefined){
let data3 = data0.source_finding_ids;
if(Array.isArray(data3)){
const len0 = data3.length;
for(let i0=0; i0<len0; i0++){
if(typeof data3[i0] !== "string"){
const err8 = {instancePath:instancePath+"/" + key0.replace(/~/g, "~0").replace(/\//g, "~1")+"/source_finding_ids/" + i0,schemaPath:"#/$defs/prefillSuggestion/properties/source_finding_ids/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
}
else {
const err9 = {instancePath:instancePath+"/" + key0.replace(/~/g, "~0").replace(/\//g, "~1")+"/source_finding_ids",schemaPath:"#/$defs/prefillSuggestion/properties/source_finding_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
}
else {
const err10 = {instancePath:instancePath+"/" + key0.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/$defs/prefillSuggestion/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
}
else {
const err11 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
validate44.errors = vErrors;
return errors === 0;
}
validate44.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate43(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://interface-sandbox.local/schemas/assemblyOutput.schema.json" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate43.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.handoff_meta === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "handoff_meta"},message:"must have required property '"+"handoff_meta"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.target_profile === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "target_profile"},message:"must have required property '"+"target_profile"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.feature_map === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "feature_map"},message:"must have required property '"+"feature_map"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.threat_findings === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "threat_findings"},message:"must have required property '"+"threat_findings"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.document_stack_status === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "document_stack_status"},message:"must have required property '"+"document_stack_status"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.vault_prefill_suggestions === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "vault_prefill_suggestions"},message:"must have required property '"+"vault_prefill_suggestions"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.vault_confirmation_questions === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "vault_confirmation_questions"},message:"must have required property '"+"vault_confirmation_questions"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.assembly_route_recommendation === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "assembly_route_recommendation"},message:"must have required property '"+"assembly_route_recommendation"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.warnings === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "warnings"},message:"must have required property '"+"warnings"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema74.properties, key0))){
const err9 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.handoff_meta !== undefined){
let data0 = data.handoff_meta;
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
if(data0.run_id === undefined){
const err10 = {instancePath:instancePath+"/handoff_meta",schemaPath:"#/properties/handoff_meta/required",keyword:"required",params:{missingProperty: "run_id"},message:"must have required property '"+"run_id"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data0.created_at === undefined){
const err11 = {instancePath:instancePath+"/handoff_meta",schemaPath:"#/properties/handoff_meta/required",keyword:"required",params:{missingProperty: "created_at"},message:"must have required property '"+"created_at"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data0.source_engine === undefined){
const err12 = {instancePath:instancePath+"/handoff_meta",schemaPath:"#/properties/handoff_meta/required",keyword:"required",params:{missingProperty: "source_engine"},message:"must have required property '"+"source_engine"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data0.target_engine === undefined){
const err13 = {instancePath:instancePath+"/handoff_meta",schemaPath:"#/properties/handoff_meta/required",keyword:"required",params:{missingProperty: "target_engine"},message:"must have required property '"+"target_engine"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data0.run_id !== undefined){
if(typeof data0.run_id !== "string"){
const err14 = {instancePath:instancePath+"/handoff_meta/run_id",schemaPath:"#/properties/handoff_meta/properties/run_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data0.created_at !== undefined){
if(!(typeof data0.created_at === "string")){
const err15 = {instancePath:instancePath+"/handoff_meta/created_at",schemaPath:"#/properties/handoff_meta/properties/created_at/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data0.source_engine !== undefined){
if("diligence" !== data0.source_engine){
const err16 = {instancePath:instancePath+"/handoff_meta/source_engine",schemaPath:"#/properties/handoff_meta/properties/source_engine/const",keyword:"const",params:{allowedValue: "diligence"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data0.target_engine !== undefined){
if("assembly" !== data0.target_engine){
const err17 = {instancePath:instancePath+"/handoff_meta/target_engine",schemaPath:"#/properties/handoff_meta/properties/target_engine/const",keyword:"const",params:{allowedValue: "assembly"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
}
else {
const err18 = {instancePath:instancePath+"/handoff_meta",schemaPath:"#/properties/handoff_meta/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.target_profile !== undefined){
let data5 = data.target_profile;
if(data5 && typeof data5 == "object" && !Array.isArray(data5)){
}
else {
const err19 = {instancePath:instancePath+"/target_profile",schemaPath:"#/properties/target_profile/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.feature_map !== undefined){
let data6 = data.feature_map;
if(Array.isArray(data6)){
const len0 = data6.length;
for(let i0=0; i0<len0; i0++){
let data7 = data6[i0];
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
}
else {
const err20 = {instancePath:instancePath+"/feature_map/" + i0,schemaPath:"#/properties/feature_map/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
}
else {
const err21 = {instancePath:instancePath+"/feature_map",schemaPath:"#/properties/feature_map/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.threat_findings !== undefined){
let data8 = data.threat_findings;
if(Array.isArray(data8)){
const len1 = data8.length;
for(let i1=0; i1<len1; i1++){
let data9 = data8[i1];
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
}
else {
const err22 = {instancePath:instancePath+"/threat_findings/" + i1,schemaPath:"#/properties/threat_findings/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
}
else {
const err23 = {instancePath:instancePath+"/threat_findings",schemaPath:"#/properties/threat_findings/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.document_stack_status !== undefined){
let data10 = data.document_stack_status;
if(Array.isArray(data10)){
const len2 = data10.length;
for(let i2=0; i2<len2; i2++){
let data11 = data10[i2];
if(data11 && typeof data11 == "object" && !Array.isArray(data11)){
}
else {
const err24 = {instancePath:instancePath+"/document_stack_status/" + i2,schemaPath:"#/properties/document_stack_status/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
}
else {
const err25 = {instancePath:instancePath+"/document_stack_status",schemaPath:"#/properties/document_stack_status/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.vault_prefill_suggestions !== undefined){
let data12 = data.vault_prefill_suggestions;
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
if(data12.baseline === undefined){
const err26 = {instancePath:instancePath+"/vault_prefill_suggestions",schemaPath:"#/properties/vault_prefill_suggestions/required",keyword:"required",params:{missingProperty: "baseline"},message:"must have required property '"+"baseline"+"'"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(data12.architecture === undefined){
const err27 = {instancePath:instancePath+"/vault_prefill_suggestions",schemaPath:"#/properties/vault_prefill_suggestions/required",keyword:"required",params:{missingProperty: "architecture"},message:"must have required property '"+"architecture"+"'"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(data12.archetypes === undefined){
const err28 = {instancePath:instancePath+"/vault_prefill_suggestions",schemaPath:"#/properties/vault_prefill_suggestions/required",keyword:"required",params:{missingProperty: "archetypes"},message:"must have required property '"+"archetypes"+"'"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(data12.compliance === undefined){
const err29 = {instancePath:instancePath+"/vault_prefill_suggestions",schemaPath:"#/properties/vault_prefill_suggestions/required",keyword:"required",params:{missingProperty: "compliance"},message:"must have required property '"+"compliance"+"'"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
for(const key1 in data12){
if(!((((key1 === "baseline") || (key1 === "architecture")) || (key1 === "archetypes")) || (key1 === "compliance"))){
const err30 = {instancePath:instancePath+"/vault_prefill_suggestions",schemaPath:"#/properties/vault_prefill_suggestions/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data12.baseline !== undefined){
if(!(validate44(data12.baseline, {instancePath:instancePath+"/vault_prefill_suggestions/baseline",parentData:data12,parentDataProperty:"baseline",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate44.errors : vErrors.concat(validate44.errors);
errors = vErrors.length;
}
}
if(data12.architecture !== undefined){
if(!(validate44(data12.architecture, {instancePath:instancePath+"/vault_prefill_suggestions/architecture",parentData:data12,parentDataProperty:"architecture",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate44.errors : vErrors.concat(validate44.errors);
errors = vErrors.length;
}
}
if(data12.archetypes !== undefined){
if(!(validate44(data12.archetypes, {instancePath:instancePath+"/vault_prefill_suggestions/archetypes",parentData:data12,parentDataProperty:"archetypes",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate44.errors : vErrors.concat(validate44.errors);
errors = vErrors.length;
}
}
if(data12.compliance !== undefined){
if(!(validate44(data12.compliance, {instancePath:instancePath+"/vault_prefill_suggestions/compliance",parentData:data12,parentDataProperty:"compliance",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate44.errors : vErrors.concat(validate44.errors);
errors = vErrors.length;
}
}
}
else {
const err31 = {instancePath:instancePath+"/vault_prefill_suggestions",schemaPath:"#/properties/vault_prefill_suggestions/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data.vault_confirmation_questions !== undefined){
let data17 = data.vault_confirmation_questions;
if(Array.isArray(data17)){
const len3 = data17.length;
for(let i3=0; i3<len3; i3++){
let data18 = data17[i3];
if(data18 && typeof data18 == "object" && !Array.isArray(data18)){
if(data18.field_path === undefined){
const err32 = {instancePath:instancePath+"/vault_confirmation_questions/" + i3,schemaPath:"#/properties/vault_confirmation_questions/items/required",keyword:"required",params:{missingProperty: "field_path"},message:"must have required property '"+"field_path"+"'"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(data18.question === undefined){
const err33 = {instancePath:instancePath+"/vault_confirmation_questions/" + i3,schemaPath:"#/properties/vault_confirmation_questions/items/required",keyword:"required",params:{missingProperty: "question"},message:"must have required property '"+"question"+"'"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(data18.why_it_matters === undefined){
const err34 = {instancePath:instancePath+"/vault_confirmation_questions/" + i3,schemaPath:"#/properties/vault_confirmation_questions/items/required",keyword:"required",params:{missingProperty: "why_it_matters"},message:"must have required property '"+"why_it_matters"+"'"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(data18.source_context === undefined){
const err35 = {instancePath:instancePath+"/vault_confirmation_questions/" + i3,schemaPath:"#/properties/vault_confirmation_questions/items/required",keyword:"required",params:{missingProperty: "source_context"},message:"must have required property '"+"source_context"+"'"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(data18.required_for === undefined){
const err36 = {instancePath:instancePath+"/vault_confirmation_questions/" + i3,schemaPath:"#/properties/vault_confirmation_questions/items/required",keyword:"required",params:{missingProperty: "required_for"},message:"must have required property '"+"required_for"+"'"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
for(const key2 in data18){
if(!(((((key2 === "field_path") || (key2 === "question")) || (key2 === "why_it_matters")) || (key2 === "source_context")) || (key2 === "required_for"))){
const err37 = {instancePath:instancePath+"/vault_confirmation_questions/" + i3,schemaPath:"#/properties/vault_confirmation_questions/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data18.field_path !== undefined){
if(typeof data18.field_path !== "string"){
const err38 = {instancePath:instancePath+"/vault_confirmation_questions/" + i3+"/field_path",schemaPath:"#/properties/vault_confirmation_questions/items/properties/field_path/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(data18.question !== undefined){
if(typeof data18.question !== "string"){
const err39 = {instancePath:instancePath+"/vault_confirmation_questions/" + i3+"/question",schemaPath:"#/properties/vault_confirmation_questions/items/properties/question/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(data18.why_it_matters !== undefined){
if(typeof data18.why_it_matters !== "string"){
const err40 = {instancePath:instancePath+"/vault_confirmation_questions/" + i3+"/why_it_matters",schemaPath:"#/properties/vault_confirmation_questions/items/properties/why_it_matters/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(data18.source_context !== undefined){
if(typeof data18.source_context !== "string"){
const err41 = {instancePath:instancePath+"/vault_confirmation_questions/" + i3+"/source_context",schemaPath:"#/properties/vault_confirmation_questions/items/properties/source_context/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
if(data18.required_for !== undefined){
if(typeof data18.required_for !== "string"){
const err42 = {instancePath:instancePath+"/vault_confirmation_questions/" + i3+"/required_for",schemaPath:"#/properties/vault_confirmation_questions/items/properties/required_for/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
}
else {
const err43 = {instancePath:instancePath+"/vault_confirmation_questions/" + i3,schemaPath:"#/properties/vault_confirmation_questions/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
}
else {
const err44 = {instancePath:instancePath+"/vault_confirmation_questions",schemaPath:"#/properties/vault_confirmation_questions/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
if(data.assembly_route_recommendation !== undefined){
let data24 = data.assembly_route_recommendation;
if(data24 && typeof data24 == "object" && !Array.isArray(data24)){
}
else {
const err45 = {instancePath:instancePath+"/assembly_route_recommendation",schemaPath:"#/properties/assembly_route_recommendation/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(data.warnings !== undefined){
let data25 = data.warnings;
if(Array.isArray(data25)){
const len4 = data25.length;
for(let i4=0; i4<len4; i4++){
if(typeof data25[i4] !== "string"){
const err46 = {instancePath:instancePath+"/warnings/" + i4,schemaPath:"#/properties/warnings/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
}
else {
const err47 = {instancePath:instancePath+"/warnings",schemaPath:"#/properties/warnings/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
}
else {
const err48 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
validate43.errors = vErrors;
return errors === 0;
}
validate43.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

export const validate_vault = validate49;
const schema77 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://interface-sandbox.local/schemas/vault.schema.json","title":"Vault Payload","description":"Canonical vault_payload generated from VAULT_JS_CANONICAL_MAP_v1.md. Vault groups are baseline, architecture, archetypes, compliance, status, and submittedAt. HITL is a route effect, not a Vault field.","type":"object","required":["baseline","architecture","archetypes","compliance","status","submittedAt"],"additionalProperties":false,"properties":{"baseline":{"type":"object","description":"Module 1: baseline and commercial fields. Integrations and output ownership live here.","required":["company","products","jurisdiction","market","delivery","integrations"],"additionalProperties":false,"properties":{"company":{"type":"string"},"entity_type":{"type":"string"},"address":{"type":"string"},"legal_email":{"type":"string"},"privacy_email":{"type":"string"},"products":{"type":"array","items":{"type":"string"}},"jurisdiction":{"type":"object","additionalProperties":false,"properties":{"country":{"type":"string"},"state":{"type":"string"}}},"market":{"type":"string","enum":["b2b","b2c","hybrid"]},"delivery":{"type":"object","additionalProperties":false,"properties":{"app":{"type":"boolean"},"api":{"type":"boolean"}}},"revenue_model":{"type":"string"},"acv":{"type":"string"},"has_beta":{"type":"boolean"},"output_ownership":{"type":"string","enum":["full","limited","none"]},"sla_type":{"type":"string","enum":["no","standard","custom"]},"integrations":{"type":"object","description":"Integrations are baseline fields, not architecture fields.","additionalProperties":false,"properties":{"slack":{"type":"boolean"},"crm":{"type":"boolean"},"stripe":{"type":"boolean"},"github":{"type":"boolean"},"webhooks":{"type":"boolean"},"none":{"type":"boolean"}}},"reliance_threshold":{"type":"string"}}},"architecture":{"type":"object","description":"Module 2: technical architecture fields only. Integration, ownership, and agent-limit fields are intentionally excluded from this group.","additionalProperties":false,"properties":{"memory":{"type":"string","enum":["rag","stateless","finetuning"]},"models":{"type":"string","enum":["selfhosted","thirdparty"]},"sub_processors":{"type":"object","additionalProperties":false,"properties":{"openai":{"type":"boolean"},"anthropic":{"type":"boolean"},"google":{"type":"boolean"},"cohere":{"type":"boolean"},"mistral":{"type":"boolean"},"other":{"type":"string"},"url":{"type":"string"}}},"cloud_host":{"type":"string"},"vector_db":{"type":"string"}}},"archetypes":{"type":"object","description":"Module 3: engine flags. JDG fans out to is_judge, is_judge_hr, and is_judge_legal. OPT fans out to is_optimizer and sens_fin. CMP sets conversational_ui and a derived companion route without emitting a literal companion field.","additionalProperties":false,"properties":{"is_doer":{"type":"boolean"},"is_orchestrator":{"type":"boolean"},"agent_limits":{"type":"object","additionalProperties":false,"properties":{"session_cap":{"type":"string"},"period_cap":{"type":"string"},"retry_limit":{"type":"string"},"loop_threshold":{"type":"string"}}},"is_creator":{"type":"boolean"},"is_reader":{"type":"boolean"},"conversational_ui":{"type":"boolean"},"sens_bio":{"type":"boolean"},"is_judge":{"type":"boolean"},"is_judge_hr":{"type":"boolean"},"is_judge_legal":{"type":"boolean"},"is_optimizer":{"type":"boolean"},"sens_fin":{"type":"boolean"},"is_shield":{"type":"boolean"},"is_mover":{"type":"boolean"},"is_generalist":{"type":"boolean"}}},"compliance":{"type":"object","description":"Module 4: compliance and surface flags.","additionalProperties":false,"properties":{"processes_pii":{"type":"string","enum":["yes","no"]},"eu_users":{"type":"boolean"},"ca_users":{"type":"boolean"},"other_regions":{"type":"array","items":{"type":"string"}},"sens_health":{"type":"boolean"},"sens_fin":{"type":"boolean"},"sens_employment":{"type":"boolean"},"minors":{"type":"boolean"},"distress":{"type":"boolean"},"standard_adults":{"type":"boolean"}}},"status":{"type":"string","enum":["intake_received"]},"submittedAt":{"type":"string","format":"date-time"}}};

function validate49(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://interface-sandbox.local/schemas/vault.schema.json" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate49.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.baseline === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "baseline"},message:"must have required property '"+"baseline"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.architecture === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "architecture"},message:"must have required property '"+"architecture"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.archetypes === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "archetypes"},message:"must have required property '"+"archetypes"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.compliance === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "compliance"},message:"must have required property '"+"compliance"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.status === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.submittedAt === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "submittedAt"},message:"must have required property '"+"submittedAt"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "baseline") || (key0 === "architecture")) || (key0 === "archetypes")) || (key0 === "compliance")) || (key0 === "status")) || (key0 === "submittedAt"))){
const err6 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.baseline !== undefined){
let data0 = data.baseline;
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
if(data0.company === undefined){
const err7 = {instancePath:instancePath+"/baseline",schemaPath:"#/properties/baseline/required",keyword:"required",params:{missingProperty: "company"},message:"must have required property '"+"company"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data0.products === undefined){
const err8 = {instancePath:instancePath+"/baseline",schemaPath:"#/properties/baseline/required",keyword:"required",params:{missingProperty: "products"},message:"must have required property '"+"products"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data0.jurisdiction === undefined){
const err9 = {instancePath:instancePath+"/baseline",schemaPath:"#/properties/baseline/required",keyword:"required",params:{missingProperty: "jurisdiction"},message:"must have required property '"+"jurisdiction"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data0.market === undefined){
const err10 = {instancePath:instancePath+"/baseline",schemaPath:"#/properties/baseline/required",keyword:"required",params:{missingProperty: "market"},message:"must have required property '"+"market"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data0.delivery === undefined){
const err11 = {instancePath:instancePath+"/baseline",schemaPath:"#/properties/baseline/required",keyword:"required",params:{missingProperty: "delivery"},message:"must have required property '"+"delivery"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data0.integrations === undefined){
const err12 = {instancePath:instancePath+"/baseline",schemaPath:"#/properties/baseline/required",keyword:"required",params:{missingProperty: "integrations"},message:"must have required property '"+"integrations"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
for(const key1 in data0){
if(!(func1.call(schema77.properties.baseline.properties, key1))){
const err13 = {instancePath:instancePath+"/baseline",schemaPath:"#/properties/baseline/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data0.company !== undefined){
if(typeof data0.company !== "string"){
const err14 = {instancePath:instancePath+"/baseline/company",schemaPath:"#/properties/baseline/properties/company/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data0.entity_type !== undefined){
if(typeof data0.entity_type !== "string"){
const err15 = {instancePath:instancePath+"/baseline/entity_type",schemaPath:"#/properties/baseline/properties/entity_type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data0.address !== undefined){
if(typeof data0.address !== "string"){
const err16 = {instancePath:instancePath+"/baseline/address",schemaPath:"#/properties/baseline/properties/address/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data0.legal_email !== undefined){
if(typeof data0.legal_email !== "string"){
const err17 = {instancePath:instancePath+"/baseline/legal_email",schemaPath:"#/properties/baseline/properties/legal_email/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data0.privacy_email !== undefined){
if(typeof data0.privacy_email !== "string"){
const err18 = {instancePath:instancePath+"/baseline/privacy_email",schemaPath:"#/properties/baseline/properties/privacy_email/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data0.products !== undefined){
let data6 = data0.products;
if(Array.isArray(data6)){
const len0 = data6.length;
for(let i0=0; i0<len0; i0++){
if(typeof data6[i0] !== "string"){
const err19 = {instancePath:instancePath+"/baseline/products/" + i0,schemaPath:"#/properties/baseline/properties/products/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
}
else {
const err20 = {instancePath:instancePath+"/baseline/products",schemaPath:"#/properties/baseline/properties/products/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data0.jurisdiction !== undefined){
let data8 = data0.jurisdiction;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
for(const key2 in data8){
if(!((key2 === "country") || (key2 === "state"))){
const err21 = {instancePath:instancePath+"/baseline/jurisdiction",schemaPath:"#/properties/baseline/properties/jurisdiction/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data8.country !== undefined){
if(typeof data8.country !== "string"){
const err22 = {instancePath:instancePath+"/baseline/jurisdiction/country",schemaPath:"#/properties/baseline/properties/jurisdiction/properties/country/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data8.state !== undefined){
if(typeof data8.state !== "string"){
const err23 = {instancePath:instancePath+"/baseline/jurisdiction/state",schemaPath:"#/properties/baseline/properties/jurisdiction/properties/state/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
}
else {
const err24 = {instancePath:instancePath+"/baseline/jurisdiction",schemaPath:"#/properties/baseline/properties/jurisdiction/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data0.market !== undefined){
let data11 = data0.market;
if(typeof data11 !== "string"){
const err25 = {instancePath:instancePath+"/baseline/market",schemaPath:"#/properties/baseline/properties/market/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(!(((data11 === "b2b") || (data11 === "b2c")) || (data11 === "hybrid"))){
const err26 = {instancePath:instancePath+"/baseline/market",schemaPath:"#/properties/baseline/properties/market/enum",keyword:"enum",params:{allowedValues: schema77.properties.baseline.properties.market.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data0.delivery !== undefined){
let data12 = data0.delivery;
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
for(const key3 in data12){
if(!((key3 === "app") || (key3 === "api"))){
const err27 = {instancePath:instancePath+"/baseline/delivery",schemaPath:"#/properties/baseline/properties/delivery/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data12.app !== undefined){
if(typeof data12.app !== "boolean"){
const err28 = {instancePath:instancePath+"/baseline/delivery/app",schemaPath:"#/properties/baseline/properties/delivery/properties/app/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data12.api !== undefined){
if(typeof data12.api !== "boolean"){
const err29 = {instancePath:instancePath+"/baseline/delivery/api",schemaPath:"#/properties/baseline/properties/delivery/properties/api/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
}
else {
const err30 = {instancePath:instancePath+"/baseline/delivery",schemaPath:"#/properties/baseline/properties/delivery/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data0.revenue_model !== undefined){
if(typeof data0.revenue_model !== "string"){
const err31 = {instancePath:instancePath+"/baseline/revenue_model",schemaPath:"#/properties/baseline/properties/revenue_model/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data0.acv !== undefined){
if(typeof data0.acv !== "string"){
const err32 = {instancePath:instancePath+"/baseline/acv",schemaPath:"#/properties/baseline/properties/acv/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data0.has_beta !== undefined){
if(typeof data0.has_beta !== "boolean"){
const err33 = {instancePath:instancePath+"/baseline/has_beta",schemaPath:"#/properties/baseline/properties/has_beta/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data0.output_ownership !== undefined){
let data18 = data0.output_ownership;
if(typeof data18 !== "string"){
const err34 = {instancePath:instancePath+"/baseline/output_ownership",schemaPath:"#/properties/baseline/properties/output_ownership/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(!(((data18 === "full") || (data18 === "limited")) || (data18 === "none"))){
const err35 = {instancePath:instancePath+"/baseline/output_ownership",schemaPath:"#/properties/baseline/properties/output_ownership/enum",keyword:"enum",params:{allowedValues: schema77.properties.baseline.properties.output_ownership.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data0.sla_type !== undefined){
let data19 = data0.sla_type;
if(typeof data19 !== "string"){
const err36 = {instancePath:instancePath+"/baseline/sla_type",schemaPath:"#/properties/baseline/properties/sla_type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(!(((data19 === "no") || (data19 === "standard")) || (data19 === "custom"))){
const err37 = {instancePath:instancePath+"/baseline/sla_type",schemaPath:"#/properties/baseline/properties/sla_type/enum",keyword:"enum",params:{allowedValues: schema77.properties.baseline.properties.sla_type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data0.integrations !== undefined){
let data20 = data0.integrations;
if(data20 && typeof data20 == "object" && !Array.isArray(data20)){
for(const key4 in data20){
if(!((((((key4 === "slack") || (key4 === "crm")) || (key4 === "stripe")) || (key4 === "github")) || (key4 === "webhooks")) || (key4 === "none"))){
const err38 = {instancePath:instancePath+"/baseline/integrations",schemaPath:"#/properties/baseline/properties/integrations/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(data20.slack !== undefined){
if(typeof data20.slack !== "boolean"){
const err39 = {instancePath:instancePath+"/baseline/integrations/slack",schemaPath:"#/properties/baseline/properties/integrations/properties/slack/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(data20.crm !== undefined){
if(typeof data20.crm !== "boolean"){
const err40 = {instancePath:instancePath+"/baseline/integrations/crm",schemaPath:"#/properties/baseline/properties/integrations/properties/crm/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(data20.stripe !== undefined){
if(typeof data20.stripe !== "boolean"){
const err41 = {instancePath:instancePath+"/baseline/integrations/stripe",schemaPath:"#/properties/baseline/properties/integrations/properties/stripe/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
if(data20.github !== undefined){
if(typeof data20.github !== "boolean"){
const err42 = {instancePath:instancePath+"/baseline/integrations/github",schemaPath:"#/properties/baseline/properties/integrations/properties/github/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data20.webhooks !== undefined){
if(typeof data20.webhooks !== "boolean"){
const err43 = {instancePath:instancePath+"/baseline/integrations/webhooks",schemaPath:"#/properties/baseline/properties/integrations/properties/webhooks/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
if(data20.none !== undefined){
if(typeof data20.none !== "boolean"){
const err44 = {instancePath:instancePath+"/baseline/integrations/none",schemaPath:"#/properties/baseline/properties/integrations/properties/none/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
}
else {
const err45 = {instancePath:instancePath+"/baseline/integrations",schemaPath:"#/properties/baseline/properties/integrations/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(data0.reliance_threshold !== undefined){
if(typeof data0.reliance_threshold !== "string"){
const err46 = {instancePath:instancePath+"/baseline/reliance_threshold",schemaPath:"#/properties/baseline/properties/reliance_threshold/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
}
else {
const err47 = {instancePath:instancePath+"/baseline",schemaPath:"#/properties/baseline/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
if(data.architecture !== undefined){
let data28 = data.architecture;
if(data28 && typeof data28 == "object" && !Array.isArray(data28)){
for(const key5 in data28){
if(!(((((key5 === "memory") || (key5 === "models")) || (key5 === "sub_processors")) || (key5 === "cloud_host")) || (key5 === "vector_db"))){
const err48 = {instancePath:instancePath+"/architecture",schemaPath:"#/properties/architecture/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
if(data28.memory !== undefined){
let data29 = data28.memory;
if(typeof data29 !== "string"){
const err49 = {instancePath:instancePath+"/architecture/memory",schemaPath:"#/properties/architecture/properties/memory/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if(!(((data29 === "rag") || (data29 === "stateless")) || (data29 === "finetuning"))){
const err50 = {instancePath:instancePath+"/architecture/memory",schemaPath:"#/properties/architecture/properties/memory/enum",keyword:"enum",params:{allowedValues: schema77.properties.architecture.properties.memory.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
if(data28.models !== undefined){
let data30 = data28.models;
if(typeof data30 !== "string"){
const err51 = {instancePath:instancePath+"/architecture/models",schemaPath:"#/properties/architecture/properties/models/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if(!((data30 === "selfhosted") || (data30 === "thirdparty"))){
const err52 = {instancePath:instancePath+"/architecture/models",schemaPath:"#/properties/architecture/properties/models/enum",keyword:"enum",params:{allowedValues: schema77.properties.architecture.properties.models.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
if(data28.sub_processors !== undefined){
let data31 = data28.sub_processors;
if(data31 && typeof data31 == "object" && !Array.isArray(data31)){
for(const key6 in data31){
if(!(((((((key6 === "openai") || (key6 === "anthropic")) || (key6 === "google")) || (key6 === "cohere")) || (key6 === "mistral")) || (key6 === "other")) || (key6 === "url"))){
const err53 = {instancePath:instancePath+"/architecture/sub_processors",schemaPath:"#/properties/architecture/properties/sub_processors/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key6},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
if(data31.openai !== undefined){
if(typeof data31.openai !== "boolean"){
const err54 = {instancePath:instancePath+"/architecture/sub_processors/openai",schemaPath:"#/properties/architecture/properties/sub_processors/properties/openai/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
if(data31.anthropic !== undefined){
if(typeof data31.anthropic !== "boolean"){
const err55 = {instancePath:instancePath+"/architecture/sub_processors/anthropic",schemaPath:"#/properties/architecture/properties/sub_processors/properties/anthropic/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
if(data31.google !== undefined){
if(typeof data31.google !== "boolean"){
const err56 = {instancePath:instancePath+"/architecture/sub_processors/google",schemaPath:"#/properties/architecture/properties/sub_processors/properties/google/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
if(data31.cohere !== undefined){
if(typeof data31.cohere !== "boolean"){
const err57 = {instancePath:instancePath+"/architecture/sub_processors/cohere",schemaPath:"#/properties/architecture/properties/sub_processors/properties/cohere/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
}
if(data31.mistral !== undefined){
if(typeof data31.mistral !== "boolean"){
const err58 = {instancePath:instancePath+"/architecture/sub_processors/mistral",schemaPath:"#/properties/architecture/properties/sub_processors/properties/mistral/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
if(data31.other !== undefined){
if(typeof data31.other !== "string"){
const err59 = {instancePath:instancePath+"/architecture/sub_processors/other",schemaPath:"#/properties/architecture/properties/sub_processors/properties/other/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
}
if(data31.url !== undefined){
if(typeof data31.url !== "string"){
const err60 = {instancePath:instancePath+"/architecture/sub_processors/url",schemaPath:"#/properties/architecture/properties/sub_processors/properties/url/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
}
}
else {
const err61 = {instancePath:instancePath+"/architecture/sub_processors",schemaPath:"#/properties/architecture/properties/sub_processors/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
}
if(data28.cloud_host !== undefined){
if(typeof data28.cloud_host !== "string"){
const err62 = {instancePath:instancePath+"/architecture/cloud_host",schemaPath:"#/properties/architecture/properties/cloud_host/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
}
if(data28.vector_db !== undefined){
if(typeof data28.vector_db !== "string"){
const err63 = {instancePath:instancePath+"/architecture/vector_db",schemaPath:"#/properties/architecture/properties/vector_db/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
}
else {
const err64 = {instancePath:instancePath+"/architecture",schemaPath:"#/properties/architecture/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
}
if(data.archetypes !== undefined){
let data41 = data.archetypes;
if(data41 && typeof data41 == "object" && !Array.isArray(data41)){
for(const key7 in data41){
if(!(func1.call(schema77.properties.archetypes.properties, key7))){
const err65 = {instancePath:instancePath+"/archetypes",schemaPath:"#/properties/archetypes/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key7},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
}
if(data41.is_doer !== undefined){
if(typeof data41.is_doer !== "boolean"){
const err66 = {instancePath:instancePath+"/archetypes/is_doer",schemaPath:"#/properties/archetypes/properties/is_doer/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
if(data41.is_orchestrator !== undefined){
if(typeof data41.is_orchestrator !== "boolean"){
const err67 = {instancePath:instancePath+"/archetypes/is_orchestrator",schemaPath:"#/properties/archetypes/properties/is_orchestrator/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
}
if(data41.agent_limits !== undefined){
let data44 = data41.agent_limits;
if(data44 && typeof data44 == "object" && !Array.isArray(data44)){
for(const key8 in data44){
if(!((((key8 === "session_cap") || (key8 === "period_cap")) || (key8 === "retry_limit")) || (key8 === "loop_threshold"))){
const err68 = {instancePath:instancePath+"/archetypes/agent_limits",schemaPath:"#/properties/archetypes/properties/agent_limits/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key8},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
}
if(data44.session_cap !== undefined){
if(typeof data44.session_cap !== "string"){
const err69 = {instancePath:instancePath+"/archetypes/agent_limits/session_cap",schemaPath:"#/properties/archetypes/properties/agent_limits/properties/session_cap/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
}
if(data44.period_cap !== undefined){
if(typeof data44.period_cap !== "string"){
const err70 = {instancePath:instancePath+"/archetypes/agent_limits/period_cap",schemaPath:"#/properties/archetypes/properties/agent_limits/properties/period_cap/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
}
if(data44.retry_limit !== undefined){
if(typeof data44.retry_limit !== "string"){
const err71 = {instancePath:instancePath+"/archetypes/agent_limits/retry_limit",schemaPath:"#/properties/archetypes/properties/agent_limits/properties/retry_limit/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
}
if(data44.loop_threshold !== undefined){
if(typeof data44.loop_threshold !== "string"){
const err72 = {instancePath:instancePath+"/archetypes/agent_limits/loop_threshold",schemaPath:"#/properties/archetypes/properties/agent_limits/properties/loop_threshold/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
}
}
else {
const err73 = {instancePath:instancePath+"/archetypes/agent_limits",schemaPath:"#/properties/archetypes/properties/agent_limits/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
}
if(data41.is_creator !== undefined){
if(typeof data41.is_creator !== "boolean"){
const err74 = {instancePath:instancePath+"/archetypes/is_creator",schemaPath:"#/properties/archetypes/properties/is_creator/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
}
if(data41.is_reader !== undefined){
if(typeof data41.is_reader !== "boolean"){
const err75 = {instancePath:instancePath+"/archetypes/is_reader",schemaPath:"#/properties/archetypes/properties/is_reader/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
}
if(data41.conversational_ui !== undefined){
if(typeof data41.conversational_ui !== "boolean"){
const err76 = {instancePath:instancePath+"/archetypes/conversational_ui",schemaPath:"#/properties/archetypes/properties/conversational_ui/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
}
if(data41.sens_bio !== undefined){
if(typeof data41.sens_bio !== "boolean"){
const err77 = {instancePath:instancePath+"/archetypes/sens_bio",schemaPath:"#/properties/archetypes/properties/sens_bio/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
}
if(data41.is_judge !== undefined){
if(typeof data41.is_judge !== "boolean"){
const err78 = {instancePath:instancePath+"/archetypes/is_judge",schemaPath:"#/properties/archetypes/properties/is_judge/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
if(data41.is_judge_hr !== undefined){
if(typeof data41.is_judge_hr !== "boolean"){
const err79 = {instancePath:instancePath+"/archetypes/is_judge_hr",schemaPath:"#/properties/archetypes/properties/is_judge_hr/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
}
if(data41.is_judge_legal !== undefined){
if(typeof data41.is_judge_legal !== "boolean"){
const err80 = {instancePath:instancePath+"/archetypes/is_judge_legal",schemaPath:"#/properties/archetypes/properties/is_judge_legal/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
}
if(data41.is_optimizer !== undefined){
if(typeof data41.is_optimizer !== "boolean"){
const err81 = {instancePath:instancePath+"/archetypes/is_optimizer",schemaPath:"#/properties/archetypes/properties/is_optimizer/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
}
if(data41.sens_fin !== undefined){
if(typeof data41.sens_fin !== "boolean"){
const err82 = {instancePath:instancePath+"/archetypes/sens_fin",schemaPath:"#/properties/archetypes/properties/sens_fin/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
}
if(data41.is_shield !== undefined){
if(typeof data41.is_shield !== "boolean"){
const err83 = {instancePath:instancePath+"/archetypes/is_shield",schemaPath:"#/properties/archetypes/properties/is_shield/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
}
if(data41.is_mover !== undefined){
if(typeof data41.is_mover !== "boolean"){
const err84 = {instancePath:instancePath+"/archetypes/is_mover",schemaPath:"#/properties/archetypes/properties/is_mover/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
}
if(data41.is_generalist !== undefined){
if(typeof data41.is_generalist !== "boolean"){
const err85 = {instancePath:instancePath+"/archetypes/is_generalist",schemaPath:"#/properties/archetypes/properties/is_generalist/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
}
}
else {
const err86 = {instancePath:instancePath+"/archetypes",schemaPath:"#/properties/archetypes/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
}
if(data.compliance !== undefined){
let data61 = data.compliance;
if(data61 && typeof data61 == "object" && !Array.isArray(data61)){
for(const key9 in data61){
if(!(func1.call(schema77.properties.compliance.properties, key9))){
const err87 = {instancePath:instancePath+"/compliance",schemaPath:"#/properties/compliance/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key9},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
}
if(data61.processes_pii !== undefined){
let data62 = data61.processes_pii;
if(typeof data62 !== "string"){
const err88 = {instancePath:instancePath+"/compliance/processes_pii",schemaPath:"#/properties/compliance/properties/processes_pii/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
if(!((data62 === "yes") || (data62 === "no"))){
const err89 = {instancePath:instancePath+"/compliance/processes_pii",schemaPath:"#/properties/compliance/properties/processes_pii/enum",keyword:"enum",params:{allowedValues: schema77.properties.compliance.properties.processes_pii.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
}
if(data61.eu_users !== undefined){
if(typeof data61.eu_users !== "boolean"){
const err90 = {instancePath:instancePath+"/compliance/eu_users",schemaPath:"#/properties/compliance/properties/eu_users/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
}
if(data61.ca_users !== undefined){
if(typeof data61.ca_users !== "boolean"){
const err91 = {instancePath:instancePath+"/compliance/ca_users",schemaPath:"#/properties/compliance/properties/ca_users/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
}
if(data61.other_regions !== undefined){
let data65 = data61.other_regions;
if(Array.isArray(data65)){
const len1 = data65.length;
for(let i1=0; i1<len1; i1++){
if(typeof data65[i1] !== "string"){
const err92 = {instancePath:instancePath+"/compliance/other_regions/" + i1,schemaPath:"#/properties/compliance/properties/other_regions/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
}
}
else {
const err93 = {instancePath:instancePath+"/compliance/other_regions",schemaPath:"#/properties/compliance/properties/other_regions/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
}
if(data61.sens_health !== undefined){
if(typeof data61.sens_health !== "boolean"){
const err94 = {instancePath:instancePath+"/compliance/sens_health",schemaPath:"#/properties/compliance/properties/sens_health/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
}
if(data61.sens_fin !== undefined){
if(typeof data61.sens_fin !== "boolean"){
const err95 = {instancePath:instancePath+"/compliance/sens_fin",schemaPath:"#/properties/compliance/properties/sens_fin/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
}
if(data61.sens_employment !== undefined){
if(typeof data61.sens_employment !== "boolean"){
const err96 = {instancePath:instancePath+"/compliance/sens_employment",schemaPath:"#/properties/compliance/properties/sens_employment/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
}
if(data61.minors !== undefined){
if(typeof data61.minors !== "boolean"){
const err97 = {instancePath:instancePath+"/compliance/minors",schemaPath:"#/properties/compliance/properties/minors/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
}
if(data61.distress !== undefined){
if(typeof data61.distress !== "boolean"){
const err98 = {instancePath:instancePath+"/compliance/distress",schemaPath:"#/properties/compliance/properties/distress/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
}
if(data61.standard_adults !== undefined){
if(typeof data61.standard_adults !== "boolean"){
const err99 = {instancePath:instancePath+"/compliance/standard_adults",schemaPath:"#/properties/compliance/properties/standard_adults/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err99];
}
else {
vErrors.push(err99);
}
errors++;
}
}
}
else {
const err100 = {instancePath:instancePath+"/compliance",schemaPath:"#/properties/compliance/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
}
if(data.status !== undefined){
let data73 = data.status;
if(typeof data73 !== "string"){
const err101 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
if(!(data73 === "intake_received")){
const err102 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/enum",keyword:"enum",params:{allowedValues: schema77.properties.status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
}
if(data.submittedAt !== undefined){
if(!(typeof data.submittedAt === "string")){
const err103 = {instancePath:instancePath+"/submittedAt",schemaPath:"#/properties/submittedAt/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
}
}
else {
const err104 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err104];
}
else {
vErrors.push(err104);
}
errors++;
}
validate49.errors = vErrors;
return errors === 0;
}
validate49.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

export const validate_handoffEnvelope = validate50;
const schema78 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://interface-sandbox.local/schemas/handoffEnvelope.schema.json","title":"Handoff Envelope","description":"Canonical handoff_envelope schema mirroring src/wrapper/contracts/handoffEnvelope.js. Includes existing JS statuses plus queued/created for future contract compatibility.","type":"object","required":["handoff_id","run_id","source_engine","target_engine","payload_type","status","created_at","updated_at","payload_ref","summary","warnings"],"additionalProperties":false,"properties":{"handoff_id":{"type":"string"},"run_id":{"type":"string"},"source_engine":{"type":"string","enum":["wrapper","diligence","assembly","delivery","horizon","maintenance"]},"target_engine":{"type":"string","enum":["wrapper","diligence","assembly","delivery","horizon","maintenance"]},"payload_type":{"type":"string","enum":["assembly_handoff_payload","delivery_package_payload","regulatory_update_payload","maintenance_alert_payload","vault_confirmation_payload","system_status_payload"]},"status":{"type":"string","enum":["draft","ready","pushed","received","failed","created","queued"]},"created_at":{"type":"string","format":"date-time"},"updated_at":{"type":"string","format":"date-time"},"payload_ref":{"type":"string"},"summary":{"type":"string"},"warnings":{"type":"array","items":{"type":"string"}}}};

function validate50(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://interface-sandbox.local/schemas/handoffEnvelope.schema.json" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate50.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.handoff_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "handoff_id"},message:"must have required property '"+"handoff_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.run_id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "run_id"},message:"must have required property '"+"run_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.source_engine === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_engine"},message:"must have required property '"+"source_engine"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.target_engine === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "target_engine"},message:"must have required property '"+"target_engine"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.payload_type === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "payload_type"},message:"must have required property '"+"payload_type"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.status === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "status"},message:"must have required property '"+"status"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.created_at === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "created_at"},message:"must have required property '"+"created_at"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.updated_at === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "updated_at"},message:"must have required property '"+"updated_at"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.payload_ref === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "payload_ref"},message:"must have required property '"+"payload_ref"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.summary === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "summary"},message:"must have required property '"+"summary"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.warnings === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "warnings"},message:"must have required property '"+"warnings"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema78.properties, key0))){
const err11 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.handoff_id !== undefined){
if(typeof data.handoff_id !== "string"){
const err12 = {instancePath:instancePath+"/handoff_id",schemaPath:"#/properties/handoff_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.run_id !== undefined){
if(typeof data.run_id !== "string"){
const err13 = {instancePath:instancePath+"/run_id",schemaPath:"#/properties/run_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.source_engine !== undefined){
let data2 = data.source_engine;
if(typeof data2 !== "string"){
const err14 = {instancePath:instancePath+"/source_engine",schemaPath:"#/properties/source_engine/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(!((((((data2 === "wrapper") || (data2 === "diligence")) || (data2 === "assembly")) || (data2 === "delivery")) || (data2 === "horizon")) || (data2 === "maintenance"))){
const err15 = {instancePath:instancePath+"/source_engine",schemaPath:"#/properties/source_engine/enum",keyword:"enum",params:{allowedValues: schema78.properties.source_engine.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.target_engine !== undefined){
let data3 = data.target_engine;
if(typeof data3 !== "string"){
const err16 = {instancePath:instancePath+"/target_engine",schemaPath:"#/properties/target_engine/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(!((((((data3 === "wrapper") || (data3 === "diligence")) || (data3 === "assembly")) || (data3 === "delivery")) || (data3 === "horizon")) || (data3 === "maintenance"))){
const err17 = {instancePath:instancePath+"/target_engine",schemaPath:"#/properties/target_engine/enum",keyword:"enum",params:{allowedValues: schema78.properties.target_engine.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.payload_type !== undefined){
let data4 = data.payload_type;
if(typeof data4 !== "string"){
const err18 = {instancePath:instancePath+"/payload_type",schemaPath:"#/properties/payload_type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(!((((((data4 === "assembly_handoff_payload") || (data4 === "delivery_package_payload")) || (data4 === "regulatory_update_payload")) || (data4 === "maintenance_alert_payload")) || (data4 === "vault_confirmation_payload")) || (data4 === "system_status_payload"))){
const err19 = {instancePath:instancePath+"/payload_type",schemaPath:"#/properties/payload_type/enum",keyword:"enum",params:{allowedValues: schema78.properties.payload_type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.status !== undefined){
let data5 = data.status;
if(typeof data5 !== "string"){
const err20 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(!(((((((data5 === "draft") || (data5 === "ready")) || (data5 === "pushed")) || (data5 === "received")) || (data5 === "failed")) || (data5 === "created")) || (data5 === "queued"))){
const err21 = {instancePath:instancePath+"/status",schemaPath:"#/properties/status/enum",keyword:"enum",params:{allowedValues: schema78.properties.status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.created_at !== undefined){
if(!(typeof data.created_at === "string")){
const err22 = {instancePath:instancePath+"/created_at",schemaPath:"#/properties/created_at/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.updated_at !== undefined){
if(!(typeof data.updated_at === "string")){
const err23 = {instancePath:instancePath+"/updated_at",schemaPath:"#/properties/updated_at/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.payload_ref !== undefined){
if(typeof data.payload_ref !== "string"){
const err24 = {instancePath:instancePath+"/payload_ref",schemaPath:"#/properties/payload_ref/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.summary !== undefined){
if(typeof data.summary !== "string"){
const err25 = {instancePath:instancePath+"/summary",schemaPath:"#/properties/summary/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.warnings !== undefined){
let data10 = data.warnings;
if(Array.isArray(data10)){
const len0 = data10.length;
for(let i0=0; i0<len0; i0++){
if(typeof data10[i0] !== "string"){
const err26 = {instancePath:instancePath+"/warnings/" + i0,schemaPath:"#/properties/warnings/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
}
else {
const err27 = {instancePath:instancePath+"/warnings",schemaPath:"#/properties/warnings/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
}
else {
const err28 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
validate50.errors = vErrors;
return errors === 0;
}
validate50.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

export const validate_diligenceRunState = validate51;
const schema79 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://interface-sandbox.local/schemas/diligenceRunState.schema.json","title":"Diligence Run State","description":"Canonical diligence_run_state for active orchestration state. raw_zoned_footprint may hold active-run raw scrape text; it is not final report payload.","type":"object","required":["run_id","current_stage","source_mode","raw_zoned_footprint","stage_outputs","validation_status","errors","retry_state","ui_filters"],"additionalProperties":false,"properties":{"run_id":{"type":"string"},"current_stage":{"type":"string","enum":["collect","refine","stage_1","stage_2","stage_3","stage_4","stage_5","handoff","complete"]},"source_mode":{"type":"string","enum":["url","manual_urls","text","url_plus_text"]},"raw_zoned_footprint":{"type":"array","items":{"type":"object","required":["zone","source_url","raw_text"],"additionalProperties":false,"properties":{"zone":{"type":"string","enum":["mechanical","commercial","governance","context","manual_text"]},"source_url":{"type":"string"},"raw_text":{"type":"string"}}}},"stage_outputs":{"type":"object","additionalProperties":true},"validation_status":{"type":"string","enum":["pending","valid","invalid","warning"]},"errors":{"type":"array","items":{"type":"string"}},"retry_state":{"type":"object","additionalProperties":true},"ui_filters":{"type":"object","additionalProperties":true}}};

function validate51(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://interface-sandbox.local/schemas/diligenceRunState.schema.json" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate51.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.run_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "run_id"},message:"must have required property '"+"run_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.current_stage === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "current_stage"},message:"must have required property '"+"current_stage"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.source_mode === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_mode"},message:"must have required property '"+"source_mode"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.raw_zoned_footprint === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "raw_zoned_footprint"},message:"must have required property '"+"raw_zoned_footprint"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.stage_outputs === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "stage_outputs"},message:"must have required property '"+"stage_outputs"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.validation_status === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "validation_status"},message:"must have required property '"+"validation_status"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.errors === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "errors"},message:"must have required property '"+"errors"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.retry_state === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "retry_state"},message:"must have required property '"+"retry_state"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.ui_filters === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "ui_filters"},message:"must have required property '"+"ui_filters"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema79.properties, key0))){
const err9 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.run_id !== undefined){
if(typeof data.run_id !== "string"){
const err10 = {instancePath:instancePath+"/run_id",schemaPath:"#/properties/run_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.current_stage !== undefined){
let data1 = data.current_stage;
if(typeof data1 !== "string"){
const err11 = {instancePath:instancePath+"/current_stage",schemaPath:"#/properties/current_stage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(!(((((((((data1 === "collect") || (data1 === "refine")) || (data1 === "stage_1")) || (data1 === "stage_2")) || (data1 === "stage_3")) || (data1 === "stage_4")) || (data1 === "stage_5")) || (data1 === "handoff")) || (data1 === "complete"))){
const err12 = {instancePath:instancePath+"/current_stage",schemaPath:"#/properties/current_stage/enum",keyword:"enum",params:{allowedValues: schema79.properties.current_stage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.source_mode !== undefined){
let data2 = data.source_mode;
if(typeof data2 !== "string"){
const err13 = {instancePath:instancePath+"/source_mode",schemaPath:"#/properties/source_mode/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!((((data2 === "url") || (data2 === "manual_urls")) || (data2 === "text")) || (data2 === "url_plus_text"))){
const err14 = {instancePath:instancePath+"/source_mode",schemaPath:"#/properties/source_mode/enum",keyword:"enum",params:{allowedValues: schema79.properties.source_mode.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.raw_zoned_footprint !== undefined){
let data3 = data.raw_zoned_footprint;
if(Array.isArray(data3)){
const len0 = data3.length;
for(let i0=0; i0<len0; i0++){
let data4 = data3[i0];
if(data4 && typeof data4 == "object" && !Array.isArray(data4)){
if(data4.zone === undefined){
const err15 = {instancePath:instancePath+"/raw_zoned_footprint/" + i0,schemaPath:"#/properties/raw_zoned_footprint/items/required",keyword:"required",params:{missingProperty: "zone"},message:"must have required property '"+"zone"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data4.source_url === undefined){
const err16 = {instancePath:instancePath+"/raw_zoned_footprint/" + i0,schemaPath:"#/properties/raw_zoned_footprint/items/required",keyword:"required",params:{missingProperty: "source_url"},message:"must have required property '"+"source_url"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data4.raw_text === undefined){
const err17 = {instancePath:instancePath+"/raw_zoned_footprint/" + i0,schemaPath:"#/properties/raw_zoned_footprint/items/required",keyword:"required",params:{missingProperty: "raw_text"},message:"must have required property '"+"raw_text"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
for(const key1 in data4){
if(!(((key1 === "zone") || (key1 === "source_url")) || (key1 === "raw_text"))){
const err18 = {instancePath:instancePath+"/raw_zoned_footprint/" + i0,schemaPath:"#/properties/raw_zoned_footprint/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data4.zone !== undefined){
let data5 = data4.zone;
if(typeof data5 !== "string"){
const err19 = {instancePath:instancePath+"/raw_zoned_footprint/" + i0+"/zone",schemaPath:"#/properties/raw_zoned_footprint/items/properties/zone/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(!(((((data5 === "mechanical") || (data5 === "commercial")) || (data5 === "governance")) || (data5 === "context")) || (data5 === "manual_text"))){
const err20 = {instancePath:instancePath+"/raw_zoned_footprint/" + i0+"/zone",schemaPath:"#/properties/raw_zoned_footprint/items/properties/zone/enum",keyword:"enum",params:{allowedValues: schema79.properties.raw_zoned_footprint.items.properties.zone.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data4.source_url !== undefined){
if(typeof data4.source_url !== "string"){
const err21 = {instancePath:instancePath+"/raw_zoned_footprint/" + i0+"/source_url",schemaPath:"#/properties/raw_zoned_footprint/items/properties/source_url/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data4.raw_text !== undefined){
if(typeof data4.raw_text !== "string"){
const err22 = {instancePath:instancePath+"/raw_zoned_footprint/" + i0+"/raw_text",schemaPath:"#/properties/raw_zoned_footprint/items/properties/raw_text/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
}
else {
const err23 = {instancePath:instancePath+"/raw_zoned_footprint/" + i0,schemaPath:"#/properties/raw_zoned_footprint/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
}
else {
const err24 = {instancePath:instancePath+"/raw_zoned_footprint",schemaPath:"#/properties/raw_zoned_footprint/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.stage_outputs !== undefined){
let data8 = data.stage_outputs;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
}
else {
const err25 = {instancePath:instancePath+"/stage_outputs",schemaPath:"#/properties/stage_outputs/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.validation_status !== undefined){
let data9 = data.validation_status;
if(typeof data9 !== "string"){
const err26 = {instancePath:instancePath+"/validation_status",schemaPath:"#/properties/validation_status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(!((((data9 === "pending") || (data9 === "valid")) || (data9 === "invalid")) || (data9 === "warning"))){
const err27 = {instancePath:instancePath+"/validation_status",schemaPath:"#/properties/validation_status/enum",keyword:"enum",params:{allowedValues: schema79.properties.validation_status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.errors !== undefined){
let data10 = data.errors;
if(Array.isArray(data10)){
const len1 = data10.length;
for(let i1=0; i1<len1; i1++){
if(typeof data10[i1] !== "string"){
const err28 = {instancePath:instancePath+"/errors/" + i1,schemaPath:"#/properties/errors/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
}
else {
const err29 = {instancePath:instancePath+"/errors",schemaPath:"#/properties/errors/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data.retry_state !== undefined){
let data12 = data.retry_state;
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
}
else {
const err30 = {instancePath:instancePath+"/retry_state",schemaPath:"#/properties/retry_state/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data.ui_filters !== undefined){
let data13 = data.ui_filters;
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
}
else {
const err31 = {instancePath:instancePath+"/ui_filters",schemaPath:"#/properties/ui_filters/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
}
else {
const err32 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
validate51.errors = vErrors;
return errors === 0;
}
validate51.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

export const validate_schemaManifest = validate52;
const schema80 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://interface-sandbox.local/schemas/schemaManifest.schema.json","title":"Schema Manifest","description":"Canonical schema_manifest mapping logical schema names to file paths and governing contracts.","type":"object","required":["version","generated_from","schemas","canonical_objects","notes"],"additionalProperties":false,"properties":{"version":{"type":"string"},"generated_from":{"type":"array","items":{"type":"string"}},"schemas":{"type":"object","required":["source_bundle","target_feature_profile","legal_stack_review","registry_evaluation_ledger","operator_challenge_gate","diligence_compiler_output","assembly_handoff_payload","vault_payload","handoff_envelope","diligence_run_state"],"additionalProperties":false,"properties":{"source_bundle":{"$ref":"#/$defs/schemaEntry"},"target_feature_profile":{"$ref":"#/$defs/schemaEntry"},"legal_stack_review":{"$ref":"#/$defs/schemaEntry"},"registry_evaluation_ledger":{"$ref":"#/$defs/schemaEntry"},"operator_challenge_gate":{"$ref":"#/$defs/schemaEntry"},"diligence_compiler_output":{"$ref":"#/$defs/schemaEntry"},"assembly_handoff_payload":{"$ref":"#/$defs/schemaEntry"},"vault_payload":{"$ref":"#/$defs/schemaEntry"},"handoff_envelope":{"$ref":"#/$defs/schemaEntry"},"diligence_run_state":{"$ref":"#/$defs/schemaEntry"},"delivery_state":{"$ref":"#/$defs/schemaEntry"},"maintenance_run":{"$ref":"#/$defs/schemaEntry"}}},"canonical_objects":{"type":"array","items":{"type":"string"}},"notes":{"type":"array","items":{"type":"string"}}},"$defs":{"schemaEntry":{"type":"object","required":["path","canonical_object","phase_status"],"additionalProperties":false,"properties":{"path":{"type":"string"},"canonical_object":{"type":"string"},"phase_status":{"type":"string","enum":["active","deferred","downstream"]}}}}};
const schema81 = {"type":"object","required":["path","canonical_object","phase_status"],"additionalProperties":false,"properties":{"path":{"type":"string"},"canonical_object":{"type":"string"},"phase_status":{"type":"string","enum":["active","deferred","downstream"]}}};

function validate52(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://interface-sandbox.local/schemas/schemaManifest.schema.json" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate52.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.version === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "version"},message:"must have required property '"+"version"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.generated_from === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "generated_from"},message:"must have required property '"+"generated_from"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.schemas === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "schemas"},message:"must have required property '"+"schemas"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.canonical_objects === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "canonical_objects"},message:"must have required property '"+"canonical_objects"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.notes === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "notes"},message:"must have required property '"+"notes"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "version") || (key0 === "generated_from")) || (key0 === "schemas")) || (key0 === "canonical_objects")) || (key0 === "notes"))){
const err5 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.version !== undefined){
if(typeof data.version !== "string"){
const err6 = {instancePath:instancePath+"/version",schemaPath:"#/properties/version/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.generated_from !== undefined){
let data1 = data.generated_from;
if(Array.isArray(data1)){
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
if(typeof data1[i0] !== "string"){
const err7 = {instancePath:instancePath+"/generated_from/" + i0,schemaPath:"#/properties/generated_from/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
}
else {
const err8 = {instancePath:instancePath+"/generated_from",schemaPath:"#/properties/generated_from/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.schemas !== undefined){
let data3 = data.schemas;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.source_bundle === undefined){
const err9 = {instancePath:instancePath+"/schemas",schemaPath:"#/properties/schemas/required",keyword:"required",params:{missingProperty: "source_bundle"},message:"must have required property '"+"source_bundle"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data3.target_feature_profile === undefined){
const err10 = {instancePath:instancePath+"/schemas",schemaPath:"#/properties/schemas/required",keyword:"required",params:{missingProperty: "target_feature_profile"},message:"must have required property '"+"target_feature_profile"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data3.legal_stack_review === undefined){
const err11 = {instancePath:instancePath+"/schemas",schemaPath:"#/properties/schemas/required",keyword:"required",params:{missingProperty: "legal_stack_review"},message:"must have required property '"+"legal_stack_review"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data3.registry_evaluation_ledger === undefined){
const err12 = {instancePath:instancePath+"/schemas",schemaPath:"#/properties/schemas/required",keyword:"required",params:{missingProperty: "registry_evaluation_ledger"},message:"must have required property '"+"registry_evaluation_ledger"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data3.operator_challenge_gate === undefined){
const err13 = {instancePath:instancePath+"/schemas",schemaPath:"#/properties/schemas/required",keyword:"required",params:{missingProperty: "operator_challenge_gate"},message:"must have required property '"+"operator_challenge_gate"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data3.diligence_compiler_output === undefined){
const err14 = {instancePath:instancePath+"/schemas",schemaPath:"#/properties/schemas/required",keyword:"required",params:{missingProperty: "diligence_compiler_output"},message:"must have required property '"+"diligence_compiler_output"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data3.assembly_handoff_payload === undefined){
const err15 = {instancePath:instancePath+"/schemas",schemaPath:"#/properties/schemas/required",keyword:"required",params:{missingProperty: "assembly_handoff_payload"},message:"must have required property '"+"assembly_handoff_payload"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data3.vault_payload === undefined){
const err16 = {instancePath:instancePath+"/schemas",schemaPath:"#/properties/schemas/required",keyword:"required",params:{missingProperty: "vault_payload"},message:"must have required property '"+"vault_payload"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data3.handoff_envelope === undefined){
const err17 = {instancePath:instancePath+"/schemas",schemaPath:"#/properties/schemas/required",keyword:"required",params:{missingProperty: "handoff_envelope"},message:"must have required property '"+"handoff_envelope"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data3.diligence_run_state === undefined){
const err18 = {instancePath:instancePath+"/schemas",schemaPath:"#/properties/schemas/required",keyword:"required",params:{missingProperty: "diligence_run_state"},message:"must have required property '"+"diligence_run_state"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
for(const key1 in data3){
if(!(func1.call(schema80.properties.schemas.properties, key1))){
const err19 = {instancePath:instancePath+"/schemas",schemaPath:"#/properties/schemas/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data3.source_bundle !== undefined){
let data4 = data3.source_bundle;
if(data4 && typeof data4 == "object" && !Array.isArray(data4)){
if(data4.path === undefined){
const err20 = {instancePath:instancePath+"/schemas/source_bundle",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "path"},message:"must have required property '"+"path"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data4.canonical_object === undefined){
const err21 = {instancePath:instancePath+"/schemas/source_bundle",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "canonical_object"},message:"must have required property '"+"canonical_object"+"'"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data4.phase_status === undefined){
const err22 = {instancePath:instancePath+"/schemas/source_bundle",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "phase_status"},message:"must have required property '"+"phase_status"+"'"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
for(const key2 in data4){
if(!(((key2 === "path") || (key2 === "canonical_object")) || (key2 === "phase_status"))){
const err23 = {instancePath:instancePath+"/schemas/source_bundle",schemaPath:"#/$defs/schemaEntry/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data4.path !== undefined){
if(typeof data4.path !== "string"){
const err24 = {instancePath:instancePath+"/schemas/source_bundle/path",schemaPath:"#/$defs/schemaEntry/properties/path/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data4.canonical_object !== undefined){
if(typeof data4.canonical_object !== "string"){
const err25 = {instancePath:instancePath+"/schemas/source_bundle/canonical_object",schemaPath:"#/$defs/schemaEntry/properties/canonical_object/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data4.phase_status !== undefined){
let data7 = data4.phase_status;
if(typeof data7 !== "string"){
const err26 = {instancePath:instancePath+"/schemas/source_bundle/phase_status",schemaPath:"#/$defs/schemaEntry/properties/phase_status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(!(((data7 === "active") || (data7 === "deferred")) || (data7 === "downstream"))){
const err27 = {instancePath:instancePath+"/schemas/source_bundle/phase_status",schemaPath:"#/$defs/schemaEntry/properties/phase_status/enum",keyword:"enum",params:{allowedValues: schema81.properties.phase_status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
}
else {
const err28 = {instancePath:instancePath+"/schemas/source_bundle",schemaPath:"#/$defs/schemaEntry/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data3.target_feature_profile !== undefined){
let data8 = data3.target_feature_profile;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.path === undefined){
const err29 = {instancePath:instancePath+"/schemas/target_feature_profile",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "path"},message:"must have required property '"+"path"+"'"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(data8.canonical_object === undefined){
const err30 = {instancePath:instancePath+"/schemas/target_feature_profile",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "canonical_object"},message:"must have required property '"+"canonical_object"+"'"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(data8.phase_status === undefined){
const err31 = {instancePath:instancePath+"/schemas/target_feature_profile",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "phase_status"},message:"must have required property '"+"phase_status"+"'"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
for(const key3 in data8){
if(!(((key3 === "path") || (key3 === "canonical_object")) || (key3 === "phase_status"))){
const err32 = {instancePath:instancePath+"/schemas/target_feature_profile",schemaPath:"#/$defs/schemaEntry/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data8.path !== undefined){
if(typeof data8.path !== "string"){
const err33 = {instancePath:instancePath+"/schemas/target_feature_profile/path",schemaPath:"#/$defs/schemaEntry/properties/path/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data8.canonical_object !== undefined){
if(typeof data8.canonical_object !== "string"){
const err34 = {instancePath:instancePath+"/schemas/target_feature_profile/canonical_object",schemaPath:"#/$defs/schemaEntry/properties/canonical_object/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(data8.phase_status !== undefined){
let data11 = data8.phase_status;
if(typeof data11 !== "string"){
const err35 = {instancePath:instancePath+"/schemas/target_feature_profile/phase_status",schemaPath:"#/$defs/schemaEntry/properties/phase_status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(!(((data11 === "active") || (data11 === "deferred")) || (data11 === "downstream"))){
const err36 = {instancePath:instancePath+"/schemas/target_feature_profile/phase_status",schemaPath:"#/$defs/schemaEntry/properties/phase_status/enum",keyword:"enum",params:{allowedValues: schema81.properties.phase_status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
}
else {
const err37 = {instancePath:instancePath+"/schemas/target_feature_profile",schemaPath:"#/$defs/schemaEntry/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data3.legal_stack_review !== undefined){
let data12 = data3.legal_stack_review;
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
if(data12.path === undefined){
const err38 = {instancePath:instancePath+"/schemas/legal_stack_review",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "path"},message:"must have required property '"+"path"+"'"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(data12.canonical_object === undefined){
const err39 = {instancePath:instancePath+"/schemas/legal_stack_review",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "canonical_object"},message:"must have required property '"+"canonical_object"+"'"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data12.phase_status === undefined){
const err40 = {instancePath:instancePath+"/schemas/legal_stack_review",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "phase_status"},message:"must have required property '"+"phase_status"+"'"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
for(const key4 in data12){
if(!(((key4 === "path") || (key4 === "canonical_object")) || (key4 === "phase_status"))){
const err41 = {instancePath:instancePath+"/schemas/legal_stack_review",schemaPath:"#/$defs/schemaEntry/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
if(data12.path !== undefined){
if(typeof data12.path !== "string"){
const err42 = {instancePath:instancePath+"/schemas/legal_stack_review/path",schemaPath:"#/$defs/schemaEntry/properties/path/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data12.canonical_object !== undefined){
if(typeof data12.canonical_object !== "string"){
const err43 = {instancePath:instancePath+"/schemas/legal_stack_review/canonical_object",schemaPath:"#/$defs/schemaEntry/properties/canonical_object/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
if(data12.phase_status !== undefined){
let data15 = data12.phase_status;
if(typeof data15 !== "string"){
const err44 = {instancePath:instancePath+"/schemas/legal_stack_review/phase_status",schemaPath:"#/$defs/schemaEntry/properties/phase_status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(!(((data15 === "active") || (data15 === "deferred")) || (data15 === "downstream"))){
const err45 = {instancePath:instancePath+"/schemas/legal_stack_review/phase_status",schemaPath:"#/$defs/schemaEntry/properties/phase_status/enum",keyword:"enum",params:{allowedValues: schema81.properties.phase_status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
}
else {
const err46 = {instancePath:instancePath+"/schemas/legal_stack_review",schemaPath:"#/$defs/schemaEntry/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
if(data3.registry_evaluation_ledger !== undefined){
let data16 = data3.registry_evaluation_ledger;
if(data16 && typeof data16 == "object" && !Array.isArray(data16)){
if(data16.path === undefined){
const err47 = {instancePath:instancePath+"/schemas/registry_evaluation_ledger",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "path"},message:"must have required property '"+"path"+"'"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(data16.canonical_object === undefined){
const err48 = {instancePath:instancePath+"/schemas/registry_evaluation_ledger",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "canonical_object"},message:"must have required property '"+"canonical_object"+"'"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(data16.phase_status === undefined){
const err49 = {instancePath:instancePath+"/schemas/registry_evaluation_ledger",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "phase_status"},message:"must have required property '"+"phase_status"+"'"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
for(const key5 in data16){
if(!(((key5 === "path") || (key5 === "canonical_object")) || (key5 === "phase_status"))){
const err50 = {instancePath:instancePath+"/schemas/registry_evaluation_ledger",schemaPath:"#/$defs/schemaEntry/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
if(data16.path !== undefined){
if(typeof data16.path !== "string"){
const err51 = {instancePath:instancePath+"/schemas/registry_evaluation_ledger/path",schemaPath:"#/$defs/schemaEntry/properties/path/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
if(data16.canonical_object !== undefined){
if(typeof data16.canonical_object !== "string"){
const err52 = {instancePath:instancePath+"/schemas/registry_evaluation_ledger/canonical_object",schemaPath:"#/$defs/schemaEntry/properties/canonical_object/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
if(data16.phase_status !== undefined){
let data19 = data16.phase_status;
if(typeof data19 !== "string"){
const err53 = {instancePath:instancePath+"/schemas/registry_evaluation_ledger/phase_status",schemaPath:"#/$defs/schemaEntry/properties/phase_status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(!(((data19 === "active") || (data19 === "deferred")) || (data19 === "downstream"))){
const err54 = {instancePath:instancePath+"/schemas/registry_evaluation_ledger/phase_status",schemaPath:"#/$defs/schemaEntry/properties/phase_status/enum",keyword:"enum",params:{allowedValues: schema81.properties.phase_status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
}
else {
const err55 = {instancePath:instancePath+"/schemas/registry_evaluation_ledger",schemaPath:"#/$defs/schemaEntry/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
if(data3.operator_challenge_gate !== undefined){
let data20 = data3.operator_challenge_gate;
if(data20 && typeof data20 == "object" && !Array.isArray(data20)){
if(data20.path === undefined){
const err56 = {instancePath:instancePath+"/schemas/operator_challenge_gate",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "path"},message:"must have required property '"+"path"+"'"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
if(data20.canonical_object === undefined){
const err57 = {instancePath:instancePath+"/schemas/operator_challenge_gate",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "canonical_object"},message:"must have required property '"+"canonical_object"+"'"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(data20.phase_status === undefined){
const err58 = {instancePath:instancePath+"/schemas/operator_challenge_gate",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "phase_status"},message:"must have required property '"+"phase_status"+"'"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
for(const key6 in data20){
if(!(((key6 === "path") || (key6 === "canonical_object")) || (key6 === "phase_status"))){
const err59 = {instancePath:instancePath+"/schemas/operator_challenge_gate",schemaPath:"#/$defs/schemaEntry/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key6},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
}
if(data20.path !== undefined){
if(typeof data20.path !== "string"){
const err60 = {instancePath:instancePath+"/schemas/operator_challenge_gate/path",schemaPath:"#/$defs/schemaEntry/properties/path/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
}
if(data20.canonical_object !== undefined){
if(typeof data20.canonical_object !== "string"){
const err61 = {instancePath:instancePath+"/schemas/operator_challenge_gate/canonical_object",schemaPath:"#/$defs/schemaEntry/properties/canonical_object/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
}
if(data20.phase_status !== undefined){
let data23 = data20.phase_status;
if(typeof data23 !== "string"){
const err62 = {instancePath:instancePath+"/schemas/operator_challenge_gate/phase_status",schemaPath:"#/$defs/schemaEntry/properties/phase_status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
if(!(((data23 === "active") || (data23 === "deferred")) || (data23 === "downstream"))){
const err63 = {instancePath:instancePath+"/schemas/operator_challenge_gate/phase_status",schemaPath:"#/$defs/schemaEntry/properties/phase_status/enum",keyword:"enum",params:{allowedValues: schema81.properties.phase_status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
}
else {
const err64 = {instancePath:instancePath+"/schemas/operator_challenge_gate",schemaPath:"#/$defs/schemaEntry/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
}
if(data3.diligence_compiler_output !== undefined){
let data24 = data3.diligence_compiler_output;
if(data24 && typeof data24 == "object" && !Array.isArray(data24)){
if(data24.path === undefined){
const err65 = {instancePath:instancePath+"/schemas/diligence_compiler_output",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "path"},message:"must have required property '"+"path"+"'"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
if(data24.canonical_object === undefined){
const err66 = {instancePath:instancePath+"/schemas/diligence_compiler_output",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "canonical_object"},message:"must have required property '"+"canonical_object"+"'"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
if(data24.phase_status === undefined){
const err67 = {instancePath:instancePath+"/schemas/diligence_compiler_output",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "phase_status"},message:"must have required property '"+"phase_status"+"'"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
for(const key7 in data24){
if(!(((key7 === "path") || (key7 === "canonical_object")) || (key7 === "phase_status"))){
const err68 = {instancePath:instancePath+"/schemas/diligence_compiler_output",schemaPath:"#/$defs/schemaEntry/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key7},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
}
if(data24.path !== undefined){
if(typeof data24.path !== "string"){
const err69 = {instancePath:instancePath+"/schemas/diligence_compiler_output/path",schemaPath:"#/$defs/schemaEntry/properties/path/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
}
if(data24.canonical_object !== undefined){
if(typeof data24.canonical_object !== "string"){
const err70 = {instancePath:instancePath+"/schemas/diligence_compiler_output/canonical_object",schemaPath:"#/$defs/schemaEntry/properties/canonical_object/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
}
if(data24.phase_status !== undefined){
let data27 = data24.phase_status;
if(typeof data27 !== "string"){
const err71 = {instancePath:instancePath+"/schemas/diligence_compiler_output/phase_status",schemaPath:"#/$defs/schemaEntry/properties/phase_status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
if(!(((data27 === "active") || (data27 === "deferred")) || (data27 === "downstream"))){
const err72 = {instancePath:instancePath+"/schemas/diligence_compiler_output/phase_status",schemaPath:"#/$defs/schemaEntry/properties/phase_status/enum",keyword:"enum",params:{allowedValues: schema81.properties.phase_status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
}
}
else {
const err73 = {instancePath:instancePath+"/schemas/diligence_compiler_output",schemaPath:"#/$defs/schemaEntry/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
}
if(data3.assembly_handoff_payload !== undefined){
let data28 = data3.assembly_handoff_payload;
if(data28 && typeof data28 == "object" && !Array.isArray(data28)){
if(data28.path === undefined){
const err74 = {instancePath:instancePath+"/schemas/assembly_handoff_payload",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "path"},message:"must have required property '"+"path"+"'"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
if(data28.canonical_object === undefined){
const err75 = {instancePath:instancePath+"/schemas/assembly_handoff_payload",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "canonical_object"},message:"must have required property '"+"canonical_object"+"'"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
if(data28.phase_status === undefined){
const err76 = {instancePath:instancePath+"/schemas/assembly_handoff_payload",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "phase_status"},message:"must have required property '"+"phase_status"+"'"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
for(const key8 in data28){
if(!(((key8 === "path") || (key8 === "canonical_object")) || (key8 === "phase_status"))){
const err77 = {instancePath:instancePath+"/schemas/assembly_handoff_payload",schemaPath:"#/$defs/schemaEntry/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key8},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
}
if(data28.path !== undefined){
if(typeof data28.path !== "string"){
const err78 = {instancePath:instancePath+"/schemas/assembly_handoff_payload/path",schemaPath:"#/$defs/schemaEntry/properties/path/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
if(data28.canonical_object !== undefined){
if(typeof data28.canonical_object !== "string"){
const err79 = {instancePath:instancePath+"/schemas/assembly_handoff_payload/canonical_object",schemaPath:"#/$defs/schemaEntry/properties/canonical_object/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
}
if(data28.phase_status !== undefined){
let data31 = data28.phase_status;
if(typeof data31 !== "string"){
const err80 = {instancePath:instancePath+"/schemas/assembly_handoff_payload/phase_status",schemaPath:"#/$defs/schemaEntry/properties/phase_status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
if(!(((data31 === "active") || (data31 === "deferred")) || (data31 === "downstream"))){
const err81 = {instancePath:instancePath+"/schemas/assembly_handoff_payload/phase_status",schemaPath:"#/$defs/schemaEntry/properties/phase_status/enum",keyword:"enum",params:{allowedValues: schema81.properties.phase_status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
}
}
else {
const err82 = {instancePath:instancePath+"/schemas/assembly_handoff_payload",schemaPath:"#/$defs/schemaEntry/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
}
if(data3.vault_payload !== undefined){
let data32 = data3.vault_payload;
if(data32 && typeof data32 == "object" && !Array.isArray(data32)){
if(data32.path === undefined){
const err83 = {instancePath:instancePath+"/schemas/vault_payload",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "path"},message:"must have required property '"+"path"+"'"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
if(data32.canonical_object === undefined){
const err84 = {instancePath:instancePath+"/schemas/vault_payload",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "canonical_object"},message:"must have required property '"+"canonical_object"+"'"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
if(data32.phase_status === undefined){
const err85 = {instancePath:instancePath+"/schemas/vault_payload",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "phase_status"},message:"must have required property '"+"phase_status"+"'"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
for(const key9 in data32){
if(!(((key9 === "path") || (key9 === "canonical_object")) || (key9 === "phase_status"))){
const err86 = {instancePath:instancePath+"/schemas/vault_payload",schemaPath:"#/$defs/schemaEntry/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key9},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
}
if(data32.path !== undefined){
if(typeof data32.path !== "string"){
const err87 = {instancePath:instancePath+"/schemas/vault_payload/path",schemaPath:"#/$defs/schemaEntry/properties/path/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
}
if(data32.canonical_object !== undefined){
if(typeof data32.canonical_object !== "string"){
const err88 = {instancePath:instancePath+"/schemas/vault_payload/canonical_object",schemaPath:"#/$defs/schemaEntry/properties/canonical_object/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
}
if(data32.phase_status !== undefined){
let data35 = data32.phase_status;
if(typeof data35 !== "string"){
const err89 = {instancePath:instancePath+"/schemas/vault_payload/phase_status",schemaPath:"#/$defs/schemaEntry/properties/phase_status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
if(!(((data35 === "active") || (data35 === "deferred")) || (data35 === "downstream"))){
const err90 = {instancePath:instancePath+"/schemas/vault_payload/phase_status",schemaPath:"#/$defs/schemaEntry/properties/phase_status/enum",keyword:"enum",params:{allowedValues: schema81.properties.phase_status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
}
}
else {
const err91 = {instancePath:instancePath+"/schemas/vault_payload",schemaPath:"#/$defs/schemaEntry/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
}
if(data3.handoff_envelope !== undefined){
let data36 = data3.handoff_envelope;
if(data36 && typeof data36 == "object" && !Array.isArray(data36)){
if(data36.path === undefined){
const err92 = {instancePath:instancePath+"/schemas/handoff_envelope",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "path"},message:"must have required property '"+"path"+"'"};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
if(data36.canonical_object === undefined){
const err93 = {instancePath:instancePath+"/schemas/handoff_envelope",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "canonical_object"},message:"must have required property '"+"canonical_object"+"'"};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
if(data36.phase_status === undefined){
const err94 = {instancePath:instancePath+"/schemas/handoff_envelope",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "phase_status"},message:"must have required property '"+"phase_status"+"'"};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
for(const key10 in data36){
if(!(((key10 === "path") || (key10 === "canonical_object")) || (key10 === "phase_status"))){
const err95 = {instancePath:instancePath+"/schemas/handoff_envelope",schemaPath:"#/$defs/schemaEntry/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key10},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
}
if(data36.path !== undefined){
if(typeof data36.path !== "string"){
const err96 = {instancePath:instancePath+"/schemas/handoff_envelope/path",schemaPath:"#/$defs/schemaEntry/properties/path/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
}
if(data36.canonical_object !== undefined){
if(typeof data36.canonical_object !== "string"){
const err97 = {instancePath:instancePath+"/schemas/handoff_envelope/canonical_object",schemaPath:"#/$defs/schemaEntry/properties/canonical_object/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
}
if(data36.phase_status !== undefined){
let data39 = data36.phase_status;
if(typeof data39 !== "string"){
const err98 = {instancePath:instancePath+"/schemas/handoff_envelope/phase_status",schemaPath:"#/$defs/schemaEntry/properties/phase_status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
if(!(((data39 === "active") || (data39 === "deferred")) || (data39 === "downstream"))){
const err99 = {instancePath:instancePath+"/schemas/handoff_envelope/phase_status",schemaPath:"#/$defs/schemaEntry/properties/phase_status/enum",keyword:"enum",params:{allowedValues: schema81.properties.phase_status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err99];
}
else {
vErrors.push(err99);
}
errors++;
}
}
}
else {
const err100 = {instancePath:instancePath+"/schemas/handoff_envelope",schemaPath:"#/$defs/schemaEntry/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
}
if(data3.diligence_run_state !== undefined){
let data40 = data3.diligence_run_state;
if(data40 && typeof data40 == "object" && !Array.isArray(data40)){
if(data40.path === undefined){
const err101 = {instancePath:instancePath+"/schemas/diligence_run_state",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "path"},message:"must have required property '"+"path"+"'"};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
if(data40.canonical_object === undefined){
const err102 = {instancePath:instancePath+"/schemas/diligence_run_state",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "canonical_object"},message:"must have required property '"+"canonical_object"+"'"};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
if(data40.phase_status === undefined){
const err103 = {instancePath:instancePath+"/schemas/diligence_run_state",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "phase_status"},message:"must have required property '"+"phase_status"+"'"};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
for(const key11 in data40){
if(!(((key11 === "path") || (key11 === "canonical_object")) || (key11 === "phase_status"))){
const err104 = {instancePath:instancePath+"/schemas/diligence_run_state",schemaPath:"#/$defs/schemaEntry/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key11},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err104];
}
else {
vErrors.push(err104);
}
errors++;
}
}
if(data40.path !== undefined){
if(typeof data40.path !== "string"){
const err105 = {instancePath:instancePath+"/schemas/diligence_run_state/path",schemaPath:"#/$defs/schemaEntry/properties/path/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
}
if(data40.canonical_object !== undefined){
if(typeof data40.canonical_object !== "string"){
const err106 = {instancePath:instancePath+"/schemas/diligence_run_state/canonical_object",schemaPath:"#/$defs/schemaEntry/properties/canonical_object/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err106];
}
else {
vErrors.push(err106);
}
errors++;
}
}
if(data40.phase_status !== undefined){
let data43 = data40.phase_status;
if(typeof data43 !== "string"){
const err107 = {instancePath:instancePath+"/schemas/diligence_run_state/phase_status",schemaPath:"#/$defs/schemaEntry/properties/phase_status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
if(!(((data43 === "active") || (data43 === "deferred")) || (data43 === "downstream"))){
const err108 = {instancePath:instancePath+"/schemas/diligence_run_state/phase_status",schemaPath:"#/$defs/schemaEntry/properties/phase_status/enum",keyword:"enum",params:{allowedValues: schema81.properties.phase_status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err108];
}
else {
vErrors.push(err108);
}
errors++;
}
}
}
else {
const err109 = {instancePath:instancePath+"/schemas/diligence_run_state",schemaPath:"#/$defs/schemaEntry/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
}
if(data3.delivery_state !== undefined){
let data44 = data3.delivery_state;
if(data44 && typeof data44 == "object" && !Array.isArray(data44)){
if(data44.path === undefined){
const err110 = {instancePath:instancePath+"/schemas/delivery_state",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "path"},message:"must have required property '"+"path"+"'"};
if(vErrors === null){
vErrors = [err110];
}
else {
vErrors.push(err110);
}
errors++;
}
if(data44.canonical_object === undefined){
const err111 = {instancePath:instancePath+"/schemas/delivery_state",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "canonical_object"},message:"must have required property '"+"canonical_object"+"'"};
if(vErrors === null){
vErrors = [err111];
}
else {
vErrors.push(err111);
}
errors++;
}
if(data44.phase_status === undefined){
const err112 = {instancePath:instancePath+"/schemas/delivery_state",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "phase_status"},message:"must have required property '"+"phase_status"+"'"};
if(vErrors === null){
vErrors = [err112];
}
else {
vErrors.push(err112);
}
errors++;
}
for(const key12 in data44){
if(!(((key12 === "path") || (key12 === "canonical_object")) || (key12 === "phase_status"))){
const err113 = {instancePath:instancePath+"/schemas/delivery_state",schemaPath:"#/$defs/schemaEntry/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key12},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err113];
}
else {
vErrors.push(err113);
}
errors++;
}
}
if(data44.path !== undefined){
if(typeof data44.path !== "string"){
const err114 = {instancePath:instancePath+"/schemas/delivery_state/path",schemaPath:"#/$defs/schemaEntry/properties/path/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err114];
}
else {
vErrors.push(err114);
}
errors++;
}
}
if(data44.canonical_object !== undefined){
if(typeof data44.canonical_object !== "string"){
const err115 = {instancePath:instancePath+"/schemas/delivery_state/canonical_object",schemaPath:"#/$defs/schemaEntry/properties/canonical_object/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err115];
}
else {
vErrors.push(err115);
}
errors++;
}
}
if(data44.phase_status !== undefined){
let data47 = data44.phase_status;
if(typeof data47 !== "string"){
const err116 = {instancePath:instancePath+"/schemas/delivery_state/phase_status",schemaPath:"#/$defs/schemaEntry/properties/phase_status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err116];
}
else {
vErrors.push(err116);
}
errors++;
}
if(!(((data47 === "active") || (data47 === "deferred")) || (data47 === "downstream"))){
const err117 = {instancePath:instancePath+"/schemas/delivery_state/phase_status",schemaPath:"#/$defs/schemaEntry/properties/phase_status/enum",keyword:"enum",params:{allowedValues: schema81.properties.phase_status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
}
}
else {
const err118 = {instancePath:instancePath+"/schemas/delivery_state",schemaPath:"#/$defs/schemaEntry/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
}
if(data3.maintenance_run !== undefined){
let data48 = data3.maintenance_run;
if(data48 && typeof data48 == "object" && !Array.isArray(data48)){
if(data48.path === undefined){
const err119 = {instancePath:instancePath+"/schemas/maintenance_run",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "path"},message:"must have required property '"+"path"+"'"};
if(vErrors === null){
vErrors = [err119];
}
else {
vErrors.push(err119);
}
errors++;
}
if(data48.canonical_object === undefined){
const err120 = {instancePath:instancePath+"/schemas/maintenance_run",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "canonical_object"},message:"must have required property '"+"canonical_object"+"'"};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
if(data48.phase_status === undefined){
const err121 = {instancePath:instancePath+"/schemas/maintenance_run",schemaPath:"#/$defs/schemaEntry/required",keyword:"required",params:{missingProperty: "phase_status"},message:"must have required property '"+"phase_status"+"'"};
if(vErrors === null){
vErrors = [err121];
}
else {
vErrors.push(err121);
}
errors++;
}
for(const key13 in data48){
if(!(((key13 === "path") || (key13 === "canonical_object")) || (key13 === "phase_status"))){
const err122 = {instancePath:instancePath+"/schemas/maintenance_run",schemaPath:"#/$defs/schemaEntry/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key13},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
}
if(data48.path !== undefined){
if(typeof data48.path !== "string"){
const err123 = {instancePath:instancePath+"/schemas/maintenance_run/path",schemaPath:"#/$defs/schemaEntry/properties/path/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err123];
}
else {
vErrors.push(err123);
}
errors++;
}
}
if(data48.canonical_object !== undefined){
if(typeof data48.canonical_object !== "string"){
const err124 = {instancePath:instancePath+"/schemas/maintenance_run/canonical_object",schemaPath:"#/$defs/schemaEntry/properties/canonical_object/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
}
if(data48.phase_status !== undefined){
let data51 = data48.phase_status;
if(typeof data51 !== "string"){
const err125 = {instancePath:instancePath+"/schemas/maintenance_run/phase_status",schemaPath:"#/$defs/schemaEntry/properties/phase_status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err125];
}
else {
vErrors.push(err125);
}
errors++;
}
if(!(((data51 === "active") || (data51 === "deferred")) || (data51 === "downstream"))){
const err126 = {instancePath:instancePath+"/schemas/maintenance_run/phase_status",schemaPath:"#/$defs/schemaEntry/properties/phase_status/enum",keyword:"enum",params:{allowedValues: schema81.properties.phase_status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err126];
}
else {
vErrors.push(err126);
}
errors++;
}
}
}
else {
const err127 = {instancePath:instancePath+"/schemas/maintenance_run",schemaPath:"#/$defs/schemaEntry/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err127];
}
else {
vErrors.push(err127);
}
errors++;
}
}
}
else {
const err128 = {instancePath:instancePath+"/schemas",schemaPath:"#/properties/schemas/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err128];
}
else {
vErrors.push(err128);
}
errors++;
}
}
if(data.canonical_objects !== undefined){
let data52 = data.canonical_objects;
if(Array.isArray(data52)){
const len1 = data52.length;
for(let i1=0; i1<len1; i1++){
if(typeof data52[i1] !== "string"){
const err129 = {instancePath:instancePath+"/canonical_objects/" + i1,schemaPath:"#/properties/canonical_objects/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err129];
}
else {
vErrors.push(err129);
}
errors++;
}
}
}
else {
const err130 = {instancePath:instancePath+"/canonical_objects",schemaPath:"#/properties/canonical_objects/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err130];
}
else {
vErrors.push(err130);
}
errors++;
}
}
if(data.notes !== undefined){
let data54 = data.notes;
if(Array.isArray(data54)){
const len2 = data54.length;
for(let i2=0; i2<len2; i2++){
if(typeof data54[i2] !== "string"){
const err131 = {instancePath:instancePath+"/notes/" + i2,schemaPath:"#/properties/notes/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err131];
}
else {
vErrors.push(err131);
}
errors++;
}
}
}
else {
const err132 = {instancePath:instancePath+"/notes",schemaPath:"#/properties/notes/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err132];
}
else {
vErrors.push(err132);
}
errors++;
}
}
}
else {
const err133 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err133];
}
else {
vErrors.push(err133);
}
errors++;
}
validate52.errors = vErrors;
return errors === 0;
}
validate52.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

export const validate_deliveryState = validate53;
const schema93 = {"$schema":"https://json-schema.org/draft/2020-12/schema","title":"Delivery State","type":"object","required":["matter_id","company_name","draft_bundle_status","crm_status","counsel_review_required","client_delivery_status","documents"],"properties":{"matter_id":{"type":"string"},"company_name":{"type":"string"},"draft_bundle_status":{"type":"string"},"crm_status":{"type":"string"},"counsel_review_required":{"type":"boolean"},"client_delivery_status":{"type":"string"},"documents":{"type":"array"}}};

function validate53(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate53.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.matter_id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "matter_id"},message:"must have required property '"+"matter_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.company_name === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "company_name"},message:"must have required property '"+"company_name"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.draft_bundle_status === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "draft_bundle_status"},message:"must have required property '"+"draft_bundle_status"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.crm_status === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "crm_status"},message:"must have required property '"+"crm_status"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.counsel_review_required === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "counsel_review_required"},message:"must have required property '"+"counsel_review_required"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.client_delivery_status === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "client_delivery_status"},message:"must have required property '"+"client_delivery_status"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.documents === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "documents"},message:"must have required property '"+"documents"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.matter_id !== undefined){
if(typeof data.matter_id !== "string"){
const err7 = {instancePath:instancePath+"/matter_id",schemaPath:"#/properties/matter_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.company_name !== undefined){
if(typeof data.company_name !== "string"){
const err8 = {instancePath:instancePath+"/company_name",schemaPath:"#/properties/company_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.draft_bundle_status !== undefined){
if(typeof data.draft_bundle_status !== "string"){
const err9 = {instancePath:instancePath+"/draft_bundle_status",schemaPath:"#/properties/draft_bundle_status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.crm_status !== undefined){
if(typeof data.crm_status !== "string"){
const err10 = {instancePath:instancePath+"/crm_status",schemaPath:"#/properties/crm_status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.counsel_review_required !== undefined){
if(typeof data.counsel_review_required !== "boolean"){
const err11 = {instancePath:instancePath+"/counsel_review_required",schemaPath:"#/properties/counsel_review_required/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.client_delivery_status !== undefined){
if(typeof data.client_delivery_status !== "string"){
const err12 = {instancePath:instancePath+"/client_delivery_status",schemaPath:"#/properties/client_delivery_status/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.documents !== undefined){
if(!(Array.isArray(data.documents))){
const err13 = {instancePath:instancePath+"/documents",schemaPath:"#/properties/documents/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
}
else {
const err14 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
validate53.errors = vErrors;
return errors === 0;
}
validate53.evaluated = {"props":{"matter_id":true,"company_name":true,"draft_bundle_status":true,"crm_status":true,"counsel_review_required":true,"client_delivery_status":true,"documents":true},"dynamicProps":false,"dynamicItems":false};

export const validate_maintenanceRun = validate54;
const schema94 = {"$schema":"https://json-schema.org/draft/2020-12/schema","title":"Maintenance Run","type":"object","required":["new_threat","coverage","recommended_update_route"],"properties":{"new_threat":{"type":"object"},"coverage":{"type":"object","required":["covered","upcoming","exposed"],"properties":{"covered":{"type":"array"},"upcoming":{"type":"array"},"exposed":{"type":"array"}}},"recommended_update_route":{"type":"array"}}};

function validate54(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate54.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.new_threat === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "new_threat"},message:"must have required property '"+"new_threat"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.coverage === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "coverage"},message:"must have required property '"+"coverage"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.recommended_update_route === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "recommended_update_route"},message:"must have required property '"+"recommended_update_route"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.new_threat !== undefined){
let data0 = data.new_threat;
if(!(data0 && typeof data0 == "object" && !Array.isArray(data0))){
const err3 = {instancePath:instancePath+"/new_threat",schemaPath:"#/properties/new_threat/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.coverage !== undefined){
let data1 = data.coverage;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.covered === undefined){
const err4 = {instancePath:instancePath+"/coverage",schemaPath:"#/properties/coverage/required",keyword:"required",params:{missingProperty: "covered"},message:"must have required property '"+"covered"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data1.upcoming === undefined){
const err5 = {instancePath:instancePath+"/coverage",schemaPath:"#/properties/coverage/required",keyword:"required",params:{missingProperty: "upcoming"},message:"must have required property '"+"upcoming"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data1.exposed === undefined){
const err6 = {instancePath:instancePath+"/coverage",schemaPath:"#/properties/coverage/required",keyword:"required",params:{missingProperty: "exposed"},message:"must have required property '"+"exposed"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data1.covered !== undefined){
if(!(Array.isArray(data1.covered))){
const err7 = {instancePath:instancePath+"/coverage/covered",schemaPath:"#/properties/coverage/properties/covered/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data1.upcoming !== undefined){
if(!(Array.isArray(data1.upcoming))){
const err8 = {instancePath:instancePath+"/coverage/upcoming",schemaPath:"#/properties/coverage/properties/upcoming/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data1.exposed !== undefined){
if(!(Array.isArray(data1.exposed))){
const err9 = {instancePath:instancePath+"/coverage/exposed",schemaPath:"#/properties/coverage/properties/exposed/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
}
else {
const err10 = {instancePath:instancePath+"/coverage",schemaPath:"#/properties/coverage/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.recommended_update_route !== undefined){
if(!(Array.isArray(data.recommended_update_route))){
const err11 = {instancePath:instancePath+"/recommended_update_route",schemaPath:"#/properties/recommended_update_route/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
}
else {
const err12 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
validate54.errors = vErrors;
return errors === 0;
}
validate54.evaluated = {"props":{"new_threat":true,"coverage":true,"recommended_update_route":true},"dynamicProps":false,"dynamicItems":false};


// Runtime lookup metadata generated by scripts/generate-diligence-validator-bundle.mjs.
export const DILIGENCE_VALIDATOR_META = Object.freeze({
  "generated_at": "2026-06-06T15:27:33.092Z",
  "schema_key_to_export": {
    "sourceBundle": "validate_sourceBundle",
    "targetFeatureProfile": "validate_targetFeatureProfile",
    "legalStackReview": "validate_legalStackReview",
    "registryLedger": "validate_registryLedger",
    "operatorChallenge": "validate_operatorChallenge",
    "compilerOutput": "validate_compilerOutput",
    "diligenceReport": "validate_diligenceReport",
    "assemblyOutput": "validate_assemblyOutput",
    "vault": "validate_vault",
    "handoffEnvelope": "validate_handoffEnvelope",
    "diligenceRunState": "validate_diligenceRunState",
    "schemaManifest": "validate_schemaManifest",
    "deliveryState": "validate_deliveryState",
    "maintenanceRun": "validate_maintenanceRun"
  },
  "canonical_key_to_schema_id": {
    "source_bundle": "sourceBundle",
    "target_feature_profile": "targetFeatureProfile",
    "legal_stack_review": "legalStackReview",
    "registry_evaluation_ledger": "registryLedger",
    "operator_challenge_gate": "operatorChallenge",
    "diligence_compiler_output": "compilerOutput",
    "final_diligence_report": "diligenceReport",
    "assembly_handoff_payload": "assemblyOutput",
    "vault_payload": "vault",
    "handoff_envelope": "handoffEnvelope",
    "diligence_run_state": "diligenceRunState",
    "schema_manifest": "schemaManifest",
    "delivery_state": "deliveryState",
    "maintenance_run": "maintenanceRun"
  }
});

const VALIDATORS = Object.freeze({
  "sourceBundle": validate_sourceBundle,
  "targetFeatureProfile": validate_targetFeatureProfile,
  "legalStackReview": validate_legalStackReview,
  "registryLedger": validate_registryLedger,
  "operatorChallenge": validate_operatorChallenge,
  "compilerOutput": validate_compilerOutput,
  "diligenceReport": validate_diligenceReport,
  "assemblyOutput": validate_assemblyOutput,
  "vault": validate_vault,
  "handoffEnvelope": validate_handoffEnvelope,
  "diligenceRunState": validate_diligenceRunState,
  "schemaManifest": validate_schemaManifest,
  "deliveryState": validate_deliveryState,
  "maintenanceRun": validate_maintenanceRun
});

export function resolveValidatorKey(schemaKey) {
  const directKey = String(schemaKey || "").trim();
  if (VALIDATORS[directKey]) return directKey;
  return DILIGENCE_VALIDATOR_META.canonical_key_to_schema_id[directKey] || directKey;
}

export function validateGeneratedSchema(schemaKey, data) {
  const resolvedKey = resolveValidatorKey(schemaKey);
  const validate = VALIDATORS[resolvedKey];

  if (typeof validate !== "function") {
    return {
      ok: false,
      schemaKey,
      resolvedKey,
      errors: [{
        keyword: "schema_lookup",
        instancePath: "",
        schemaPath: "",
        message: "Generated validator not found for " + schemaKey,
        params: {}
      }]
    };
  }

  const ok = validate(data);
  return {
    ok,
    schemaKey,
    resolvedKey,
    errors: validate.errors || []
  };
}
