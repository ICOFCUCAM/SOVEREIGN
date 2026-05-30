# Sovereign Dispatch — worker image (Epic 6 / ADR-001): renders PDF (headless
# Chromium) + DOCX + MD. Build context = repository root:
#   docker build -f services/dispatch-worker/Dockerfile -t dispatch-worker .
FROM node:20-slim AS base
ENV NODE_ENV=production
WORKDIR /app

# Headless Chromium for PDF rendering (distro chromium pulls the needed shared
# libs). fonts-* give deterministic embedded fonts; tini reaps the short-lived
# Chromium child processes so defunct procs don't accumulate.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       chromium fonts-liberation fonts-dejavu-core ca-certificates tini \
  && rm -rf /var/lib/apt/lists/*
ENV CHROMIUM_BIN=/usr/bin/chromium

# Frozen DDM engine/renderers + their deps (worker builds the Layout Model and
# renders md/pdf/docx — imports @dispatch/ddm-schema/{engine,render-md,render-html}).
COPY packages/ddm-schema/package.json packages/ddm-schema/package-lock.json ./packages/ddm-schema/
RUN cd packages/ddm-schema && npm ci --omit=dev --no-audit --no-fund
COPY packages/ ./packages/

# Service workspace (shared + worker; pulls pg + docx). The SPA is never copied.
COPY services/package.json ./services/package.json
COPY services/shared ./services/shared
COPY services/dispatch-worker ./services/dispatch-worker
RUN cd services && npm install --omit=dev --no-audit --no-fund

# Chromium needs a writable HOME for its profile/tmp; run unprivileged.
USER node
ENV HOME=/tmp
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "services/dispatch-worker/src/worker.mjs"]
