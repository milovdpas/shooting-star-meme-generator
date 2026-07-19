# shooting-star-meme-generator

Vue/Vite frontend for the shooting stars meme generator.

Production: https://meme-creator.milovanderpas.nl
API: https://meme-creator-api.milovanderpas.fun (repo `meme-generator-api`, routes under `/api/shooting-stars`)

## Local development

```sh
cd frontend
npm install
npm run dev
```

## Deployment

Push to `main` → GitHub Actions builds the image, pushes it to Docker Hub
(`milovdpas8/meme-creator-frontend`) and deploys it to the VPS via Docker Compose.
See the VPS docs (repo `vps`, doc 04) for the pattern.

Required GitHub secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `VPS_HOST`, `VPS_USER`,
`VPS_SSH_PRIVATE_KEY`. Required repo variable: `API_URL` (baked into the build as `VITE_API_URL`).
