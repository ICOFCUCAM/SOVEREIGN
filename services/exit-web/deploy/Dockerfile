# syntax=docker/dockerfile:1.7
# ExitOS website — the DeployPro build (also works with any Docker host).
#
# Build from the REPOSITORY ROOT, not from services/exit-web: the site depends
# on its sibling package services/exit-engines (`file:../exit-engines`), so the
# build needs both folders. In DeployPro: leave "Root directory" empty and set
# "Dockerfile path" to services/exit-web/deploy/Dockerfile.
#
# Build-time variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, …) come from
# the DeployPro project's environment, which DeployPro hands to the build as
# the secret `env`; with plain Docker pass one with
#   docker build --secret id=env,src=.env.production -f services/exit-web/deploy/Dockerfile .
# The marketing site builds and runs without any of them.

FROM node:22-alpine AS build
WORKDIR /app/services

# install both packages first, so their dependency layers cache between deploys
COPY services/exit-engines/package.json services/exit-engines/package-lock.json exit-engines/
RUN --mount=type=cache,target=/root/.npm cd exit-engines && npm ci --no-audit --no-fund
COPY services/exit-web/package.json services/exit-web/package-lock.json exit-web/
COPY services/exit-engines exit-engines
RUN --mount=type=cache,target=/root/.npm cd exit-web && npm ci --no-audit --no-fund

COPY services/exit-web exit-web
# a build-info file copied from a working tree (dist/ is not) would tell tsc the engines are
# already built and leave them without output; build them from scratch
RUN find . -name '*.tsbuildinfo' -not -path '*/node_modules/*' -delete
RUN --mount=type=secret,id=env \
    set -a; [ -f /run/secrets/env ] && . /run/secrets/env; set +a; \
    cd exit-web && npm run build

# serve the built site with Caddy: single-page-app fallback, platform headers
FROM caddy:2-alpine AS run
COPY services/exit-web/deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/services/exit-web/dist /srv
# Containers on DeployPro run with no-new-privileges, under which the kernel
# refuses to exec a binary carrying file capabilities; caddy ships with one
# for binding :80. This listens on 8080, so the capability is dropped.
RUN apk add --no-cache --virtual .setcap libcap \
    && setcap -r /usr/bin/caddy \
    && apk del .setcap
EXPOSE 8080
USER 1000:1000
CMD ["caddy", "run", "--adapter", "caddyfile", "--config", "/etc/caddy/Caddyfile"]
