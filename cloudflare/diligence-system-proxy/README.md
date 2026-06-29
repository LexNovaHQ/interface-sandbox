# Interface Diligence System Cloudflare Proxy

This Worker is the public Cloudflare front door for the Interface Diligence Engine hosted on Cloud Run.

It proxies only these public paths from `sandbox.lexnovahq.com` to the Cloud Run backend origin:

- `/interface-diligence/diligence-system*`
- `/public*`
- `/vault*`
- `/health`

It does not proxy the rest of the domain. The portfolio site remains separate.

## Required origin

Set `BACKEND_ORIGIN` to the deployed Cloud Run service URL, for example:

```bash
wrangler secret put BACKEND_ORIGIN
# paste: https://interface-diligence-artifacts-xxxxx.a.run.app
```

Or replace the placeholder in `wrangler.toml` before deploy.

## Deploy

From this folder:

```bash
cd cloudflare/diligence-system-proxy
npx wrangler deploy
```

## Public URLs after deploy

```text
https://sandbox.lexnovahq.com/interface-diligence/diligence-system/
https://sandbox.lexnovahq.com/interface-diligence/diligence-system/report.html?run_id=<RUN_ID>
https://sandbox.lexnovahq.com/vault/intake.html?source=diligence-system&run_id=<RUN_ID>
```

## Smoke

```bash
curl -i https://sandbox.lexnovahq.com/health
curl -i https://sandbox.lexnovahq.com/interface-diligence/diligence-system/
```

Then run a browser smoke:

1. Open `/interface-diligence/diligence-system/`.
2. Enter a public target URL.
3. Confirm the live rail updates.
4. Confirm report opens on completion.
5. Confirm Download PDF opens print dialog.
6. Confirm Proceed to Vault preserves the same run ID.
