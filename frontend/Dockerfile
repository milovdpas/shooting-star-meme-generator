# build stage
# node:22 — Node 20 reached EOL on 2026-04-30. The old pin was a precaution about
# Vite 3 predating newer Node; verified 2026-09-24 that Vite 3 builds clean on 22.
# Build stage only in any case: the container that runs is nginx, below.
FROM node:22-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Baseline env from the template; the VITE_* build args below take priority over .env
RUN cp -f .env.dist .env

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# production stage
FROM nginx:stable-alpine AS production-stage
COPY nginx/nginx.conf /etc/nginx/nginx.conf
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
