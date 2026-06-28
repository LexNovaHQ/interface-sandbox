# Hunter Monolith Bundle Validation

## Syntax

```text
node --check passed with no output
```

## Static check

```json
{
  "ok": true,
  "prompt_sha256": "a3bd49e00b107aa7c50d5e06714b58a84fb7985e07f6601c1b0a8626fc8fffbc",
  "server_chars": 26613,
  "prompt_chars": 555352
}
```

## Scope

- Built separate `diligence-hunter-monolith` lane.
- No GitHub write.
- No deploy.
- No mutation to current `diligence-monolithic` files.
- Uses flat `GEMINI_API_KEYS` only.
- Uses one grounded Gemini monolith call.
- Does not use job endpoints, source bridge manifests, or server-side evidence creation.
