import fs from "node:fs";

const file = "references/registry/Diligence_Field_Derivation_Registry.yml";
let text = fs.readFileSync(file, "utf8");

text = replaceOnce(text,
`    exclude_if: ["Any mounted-key PRIMARY_DOMAIN rule fires."]`,
`    exclude_if:
      any:
        - rule_fired_any_type: PRIMARY_DOMAIN`
);
text = replaceOnce(text,
`    conditions: {C1: "non-AI primary locked", C2: "AI_OVERLAY_MOUNTED fires", C3: "AI used inside a primary-domain activity", C4: "candidate depends on both primary activity and AI mechanics", C5: "duty (if later confirmed) is created by the primary domain's law/regulator/control framework"}
    trigger_if: "C1 AND C2 AND C3 AND C4 AND C5"
    exclude_if: ["Fully pure-AI exposure.", "Fully pure-domain exposure.", "AI mount is AI_CANDIDATE_ONLY or AI_NOT_VISIBLE."]`,
`    conditions: {C1: "non-AI primary locked", C2: "AI_OVERLAY_MOUNTED fires", C3: "AI used inside a primary-domain activity", C4: "candidate depends on both primary activity and AI mechanics", C5: "duty (if later confirmed) is created by the primary domain's law/regulator/control framework", C6: "Fully pure-AI exposure.", C7: "Fully pure-domain exposure.", C8: "AI mount is AI_CANDIDATE_ONLY or AI_NOT_VISIBLE."}
    trigger_if: "C1 AND C2 AND C3 AND C4 AND C5"
    exclude_if:
      any:
        - condition: C6
        - condition: C7
        - condition: C8`
);
text = replaceOnce(text,
`    condition_grammar: "CONDITION_N -> TRIGGER_IF -> EXCLUDE_IF; trigger_if may use AND/OR/NOT/parentheses over declared condition ids; exclude_if mandatory; conditions must be concrete public-footprint criteria; no Phase 2 index as evidence."`,
`    condition_grammar: "CONDITION_N -> TRIGGER_IF -> EXCLUDE_IF; trigger_if may use AND/OR/NOT/parentheses over declared condition ids; exclude_if must use machine grammar operators any/all/not/condition/rule_fired/rule_fired_any/rule_fired_any_type/literal; conditions must be concrete public-footprint criteria; no Phase 2 index as evidence."`
);

fs.writeFileSync(file, text);
console.log("CO-E2E-02 FDR exclusion grammar applied");

function replaceOnce(value, from, to) {
  if (!value.includes(from)) throw new Error(`PATCH_ANCHOR_MISSING:${from.slice(0, 100)}`);
  return value.replace(from, to);
}
