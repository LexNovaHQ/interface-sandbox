(function(){
"use strict";
const VERSION="interface_state_system.v1";
const TITLES={report_not_ready:"Report not ready",controlled_failure:"Run controlled failure",pass_with_limitation:"Completed with limitation",missing_artifact:"Required artifact unavailable",network_failure:"Network or API failure",empty:"No material available"};
window.InterfaceUIState=Object.freeze({version:VERSION,render,classify,applyDocumentState});
document.addEventListener("DOMContentLoaded",()=>{applyDocumentState();observe();});
function classify(value){const text=String(value||"").toUpperCase();if(/CONTROLLED_FAILURE|DO NOT RELY|CRITICAL FAILURE/.test(text))return"controlled_failure";if(/PASS_WITH_LIMITATION|LOCKED_WITH_LIMITATIONS|WARNING|LIMITATION/.test(text))return"pass_with_limitation";if(/MISSING ARTIFACT|ARTIFACT.*MISSING|NOT FOUND/.test(text))return"missing_artifact";if(/NETWORK|FETCH|API FAILURE|FAILED TO FETCH|5\d\d:/.test(text))return"network_failure";if(/REPORT NOT READY|RENDERER PAYLOAD.*UNAVAILABLE|NOT READY/.test(text))return"report_not_ready";return"";}
function applyDocumentState(){const source=[document.body?.innerText||"",document.documentElement.dataset.reportRenderState||""].join(" ");const kind=classify(source);if(kind)document.documentElement.dataset.uiState=kind;}
function observe(){if(!("MutationObserver" in window)||!document.body)return;new MutationObserver(applyDocumentState).observe(document.body,{subtree:true,childList:true,characterData:true});}
function render({target,kind="empty",title,message,code="",actions=[],compact=false}={}){if(!target)return null;const root=node("section",`interface-state is-${kind}${compact?" interface-state-compact":""}`);root.setAttribute("role",kind==="controlled_failure"||kind==="network_failure"?"alert":"status");root.append(node("div","interface-state-kicker",label(kind)),node("h2","",title||TITLES[kind]||"Interface state"),node("p","",message||"No additional detail is available."));if(code)root.append(node("div","interface-state-code",code));if(actions.length){const row=node("div","interface-state-actions");actions.forEach(action=>{const link=node("a",action.primary?"btn":"btn secondary",action.label);link.href=action.href||"#";row.append(link)});root.append(row);}target.replaceChildren(root);document.documentElement.dataset.uiState=kind;return root;}
function label(value){return String(value||"").replaceAll("_"," ").replace(/\b\w/g,m=>m.toUpperCase());}
function node(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!=null)el.textContent=String(text);return el;}
})();
