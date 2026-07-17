# FluxBox website — Cloudflare Pages

## Deploy
1. In Cloudflare Pages, create a project from this repo (or upload the `website` folder).
2. Set **Build output directory** to `website` (if connecting the whole repo), or deploy the `website` folder as the root.
3. No build command needed — static HTML/CSS.

## Local preview
```bash
cd website && python3 -m http.server 8080
```
Open http://localhost:8080
