# Claude Studio runner: the owner's Claude Code behind an admin-only API.
FROM node:22-slim

# The Claude Code version this runner was tested against. Upgrade deliberately.
RUN npm install -g @anthropic-ai/claude-code@2.1.310 && npm cache clean --force

ENV NODE_ENV=production DATA_DIR=/data PORT=8787 DISABLE_AUTOUPDATER=1
WORKDIR /app
COPY package.json ./
COPY src ./src

# Run as an unprivileged user; projects and Claude's conversation history live on /data.
RUN useradd --create-home --uid 10001 studio && mkdir -p /data && chown studio:studio /data
USER studio
VOLUME ["/data"]
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8787)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "src/server.mjs"]
