# Interface Sandbox Public Surface

`sandbox.lexnovahq.com` is the operating-system public surface.

The Cloudflare Pages project is `interface-sandbox`.

The build command is:

```text
npm run build
```

The output directory is:

```text
dist
```

The API proxy route is:

```text
/api/interface-diligence/*
```

The required Cloudflare Pages environment variable is:

```text
DILIGENCE_BACKEND_URL=<Cloud Run backend URL>
```

The browser never calls Cloud Run directly.

Do not use `portfolio-shwetav` for this system.

No diligence run was performed while adding this connection layer. Mechanical checks only.
