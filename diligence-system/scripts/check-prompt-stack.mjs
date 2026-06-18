import { validatePromptStack } from "../prompt-stack-loader.js";

const result = validatePromptStack();
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok === true ? 0 : 1);
