import fs from "node:fs";

patchAiKey();
patchFintechKey();
console.log("CO-E2E-02 package-key exclusion grammar applied");

function patchAiKey() {
  const file = "references/registry/AI_Registry_Key.yml";
  let text = fs.readFileSync(file, "utf8");
  text = replaceOnce(text,
`      C8: "Evidence appears in >=1 admitted product-facing or legal/control source (product/platform/API/docs/demo/pricing/terms/AI policy/trust/help/integration/announcement)."
    trigger_if: "C1 AND (C2 OR C3 OR C4 OR C5 OR C6) AND C7 AND C8"
    exclude_if:
      - "A non-AI primary-domain rule fires and the AI capability is only the mechanism used inside that non-AI vertical activity."
      - "The only AI evidence is generic wording (AI-powered/smart/automated/SEO/blog/hiring/investor/roadmap) with no concrete current AI product capability."`,
`      C8: "Evidence appears in >=1 admitted product-facing or legal/control source (product/platform/API/docs/demo/pricing/terms/AI policy/trust/help/integration/announcement)."
      C9: "A non-AI primary-domain rule fires and the AI capability is only the mechanism used inside that non-AI vertical activity."
      C10: "The only AI evidence is generic wording (AI-powered/smart/automated/SEO/blog/hiring/investor/roadmap) with no concrete current AI product capability."
    trigger_if: "C1 AND (C2 OR C3 OR C4 OR C5 OR C6) AND C7 AND C8"
    exclude_if:
      any:
        - condition: C9
        - condition: C10`
  );
  text = replaceOnce(text,
`      C8: "AI function appears in >=1 admitted product-facing or legal/control source."
      trigger_if: "C1 AND (C2 OR C3 OR C4 OR C5 OR C6) AND C7 AND C8"
      exclude_if: ["Primary domain is ai-governance.", "AI appears only as generic marketing/SEO/blog/hiring/investor/roadmap language."]`,
`      C8: "AI function appears in >=1 admitted product-facing or legal/control source."
      C9: "AI appears only as generic marketing/SEO/blog/hiring/investor/roadmap language."
      trigger_if: "C1 AND (C2 OR C3 OR C4 OR C5 OR C6) AND C7 AND C8"
      exclude_if:
        any:
          - rule_fired: PRIMARY_DOMAIN_AI_GOVERNANCE
          - condition: C9`
  );
  text = replaceOnce(text,
`      exclude_if: ["PRIMARY_DOMAIN_AI_GOVERNANCE fires.", "AI_OVERLAY_MOUNTED fires."]`,
`      exclude_if:
        any:
          - rule_fired_any: [PRIMARY_DOMAIN_AI_GOVERNANCE, AI_OVERLAY_MOUNTED]`
  );
  text = replaceOnce(text,
`      exclude_if: ["PRIMARY_DOMAIN_AI_GOVERNANCE fires.", "AI_OVERLAY_MOUNTED fires.", "AI_CANDIDATE_ONLY fires."]`,
`      exclude_if:
        any:
          - rule_fired_any: [PRIMARY_DOMAIN_AI_GOVERNANCE, AI_OVERLAY_MOUNTED, AI_CANDIDATE_ONLY]`
  );
  fs.writeFileSync(file, text);
}

function patchFintechKey() {
  const file = "references/registry/FinTech_Registry_Key.yml";
  let text = fs.readFileSync(file, "utf8");
  text = replaceOnce(text,
`      C10: "Evidence appears in >=1 admitted product-facing or legal/control source tied to the actual offering."
    trigger_if: "C1 AND (C2 OR C3 OR C4 OR C5 OR C6 OR C7 OR C8) AND C9 AND C10"
    exclude_if:
      - "The only financial signal is subscription billing/generic pricing/SaaS-fee collection/investor relations/customer logos/blog/case study/finance vertical example for a non-financial product."
      - "The actual reviewed offering is an AI product and finance appears only as a customer use case/demo/industry page/example vertical."`,
`      C10: "Evidence appears in >=1 admitted product-facing or legal/control source tied to the actual offering."
      C11: "The only financial signal is subscription billing/generic pricing/SaaS-fee collection/investor relations/customer logos/blog/case study/finance vertical example for a non-financial product."
      C12: "The actual reviewed offering is an AI product and finance appears only as a customer use case/demo/industry page/example vertical."
    trigger_if: "C1 AND (C2 OR C3 OR C4 OR C5 OR C6 OR C7 OR C8) AND C9 AND C10"
    exclude_if:
      any:
        - condition: C11
        - condition: C12`
  );
  fs.writeFileSync(file, text);
}

function replaceOnce(value, from, to) {
  if (!value.includes(from)) throw new Error(`PATCH_ANCHOR_MISSING:${from.slice(0, 90)}`);
  return value.replace(from, to);
}
