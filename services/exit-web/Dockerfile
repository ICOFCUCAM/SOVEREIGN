# ExitOS console — static SPA built with Vite, served by nginx.
# Separate deployable from the Sovereign website and from exit-api.
# VITE_EXIT_API_URL is baked at build time (points at the deployed API);
# leave empty to serve same-origin behind a gateway that also routes /v1.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY . .
ARG VITE_EXIT_API_URL=""
ENV VITE_EXIT_API_URL=$VITE_EXIT_API_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
