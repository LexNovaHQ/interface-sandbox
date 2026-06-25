# AI_THREAT_REGISTRY.yaml — Surgical YAML Repair Audit

## Scope

This repair changes YAML syntax only. It does not rewrite registry content, threat rows, triggers, authorities, pain tiers, fixes, or provenance.

## Result

- Strict YAML parse: PASS
- Parsed rows: 98
- Changed lines: 103
- Original SHA-256: `2527ea72632703622c06a09069205ed0b213bcbd503673351d6c37d89f9798d9`
- Repaired SHA-256: `cd71194ee586cbb12eedacb07e842d24aabce269b618411ea69a2188ca3bd19a`

## Surgical edits applied

The original file failed because unquoted scalar values contained YAML mapping syntax, especially `Hunter_Trigger: CONDITION_1: ...`.

The repair quotes only unquoted scalar values containing `: `.

Changed fields:

- `Hunter_Trigger`: 98
- `FP_Mechanism`: 1
- `Authority_US`: 3
- `Legal_Pain`: 1

## Non-syntax issues observed but not changed

- `DOE_FIN_001` does not match the v3.0 Threat_ID regex because `FIN` is retired/folded into `LIA` under the registry key. This was not changed because it is a schema/content decision, not YAML syntax repair.

## Changed line numbers

- Line 21: `Hunter_Trigger` quoted
- Line 42: `FP_Mechanism` quoted
- Line 45: `Hunter_Trigger` quoted
- Line 69: `Hunter_Trigger` quoted
- Line 82: `Authority_US` quoted
- Line 93: `Hunter_Trigger` quoted
- Line 117: `Hunter_Trigger` quoted
- Line 141: `Hunter_Trigger` quoted
- Line 165: `Hunter_Trigger` quoted
- Line 189: `Hunter_Trigger` quoted
- Line 213: `Hunter_Trigger` quoted
- Line 237: `Hunter_Trigger` quoted
- Line 261: `Hunter_Trigger` quoted
- Line 285: `Hunter_Trigger` quoted
- Line 309: `Hunter_Trigger` quoted
- Line 333: `Hunter_Trigger` quoted
- Line 357: `Hunter_Trigger` quoted
- Line 370: `Authority_US` quoted
- Line 381: `Hunter_Trigger` quoted
- Line 405: `Hunter_Trigger` quoted
- Line 429: `Hunter_Trigger` quoted
- Line 453: `Hunter_Trigger` quoted
- Line 477: `Hunter_Trigger` quoted
- Line 501: `Hunter_Trigger` quoted
- Line 525: `Hunter_Trigger` quoted
- Line 549: `Hunter_Trigger` quoted
- Line 573: `Hunter_Trigger` quoted
- Line 597: `Hunter_Trigger` quoted
- Line 621: `Hunter_Trigger` quoted
- Line 645: `Hunter_Trigger` quoted
- Line 669: `Hunter_Trigger` quoted
- Line 693: `Hunter_Trigger` quoted
- Line 717: `Hunter_Trigger` quoted
- Line 741: `Hunter_Trigger` quoted
- Line 765: `Hunter_Trigger` quoted
- Line 789: `Hunter_Trigger` quoted
- Line 813: `Hunter_Trigger` quoted
- Line 837: `Hunter_Trigger` quoted
- Line 861: `Hunter_Trigger` quoted
- Line 885: `Hunter_Trigger` quoted
- Line 909: `Hunter_Trigger` quoted
- Line 933: `Hunter_Trigger` quoted
- Line 957: `Hunter_Trigger` quoted
- Line 981: `Hunter_Trigger` quoted
- Line 1005: `Hunter_Trigger` quoted
- Line 1029: `Hunter_Trigger` quoted
- Line 1053: `Hunter_Trigger` quoted
- Line 1077: `Hunter_Trigger` quoted
- Line 1101: `Hunter_Trigger` quoted
- Line 1125: `Hunter_Trigger` quoted
- Line 1149: `Hunter_Trigger` quoted
- Line 1173: `Hunter_Trigger` quoted
- Line 1197: `Hunter_Trigger` quoted
- Line 1221: `Hunter_Trigger` quoted
- Line 1245: `Hunter_Trigger` quoted
- Line 1269: `Hunter_Trigger` quoted
- Line 1293: `Hunter_Trigger` quoted
- Line 1317: `Hunter_Trigger` quoted
- Line 1341: `Hunter_Trigger` quoted
- Line 1365: `Hunter_Trigger` quoted
- Line 1389: `Hunter_Trigger` quoted
- Line 1413: `Hunter_Trigger` quoted
- Line 1437: `Hunter_Trigger` quoted
- Line 1461: `Hunter_Trigger` quoted
- Line 1485: `Hunter_Trigger` quoted
- Line 1509: `Hunter_Trigger` quoted
- Line 1533: `Hunter_Trigger` quoted
- Line 1557: `Hunter_Trigger` quoted
- Line 1581: `Hunter_Trigger` quoted
- Line 1605: `Hunter_Trigger` quoted
- Line 1618: `Authority_US` quoted
- Line 1629: `Hunter_Trigger` quoted
- Line 1653: `Hunter_Trigger` quoted
- Line 1677: `Hunter_Trigger` quoted
- Line 1697: `Legal_Pain` quoted
- Line 1701: `Hunter_Trigger` quoted
- Line 1725: `Hunter_Trigger` quoted
- Line 1749: `Hunter_Trigger` quoted
- Line 1773: `Hunter_Trigger` quoted
- Line 1797: `Hunter_Trigger` quoted
- Line 1821: `Hunter_Trigger` quoted
- Line 1845: `Hunter_Trigger` quoted
- Line 1869: `Hunter_Trigger` quoted
- Line 1893: `Hunter_Trigger` quoted
- Line 1917: `Hunter_Trigger` quoted
- Line 1941: `Hunter_Trigger` quoted
- Line 1965: `Hunter_Trigger` quoted
- Line 1989: `Hunter_Trigger` quoted
- Line 2013: `Hunter_Trigger` quoted
- Line 2037: `Hunter_Trigger` quoted
- Line 2061: `Hunter_Trigger` quoted
- Line 2085: `Hunter_Trigger` quoted
- Line 2109: `Hunter_Trigger` quoted
- Line 2133: `Hunter_Trigger` quoted
- Line 2157: `Hunter_Trigger` quoted
- Line 2181: `Hunter_Trigger` quoted
- Line 2205: `Hunter_Trigger` quoted
- Line 2229: `Hunter_Trigger` quoted
- Line 2253: `Hunter_Trigger` quoted
- Line 2277: `Hunter_Trigger` quoted
- Line 2301: `Hunter_Trigger` quoted
- Line 2325: `Hunter_Trigger` quoted
- Line 2349: `Hunter_Trigger` quoted
