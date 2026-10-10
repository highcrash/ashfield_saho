# Smart Home Estimator — server image (Node 22)
# Used by DigitalOcean App Platform (.do/app.yaml) and by deploy/docker-compose.yml.
#   docker build -t smart-home-estimator .
FROM node:22-alpine
WORKDIR /app
COPY server/package.json server/package-lock.json server/
RUN cd server && npm ci --omit=dev && npm cache clean --force
COPY . .
RUN rm -rf storage deploy .do README.md .htaccess Dockerfile \
 && mkdir -p storage && chown -R node:node storage
USER node
ENV NODE_ENV=production PORT=3000 STORAGE_DIR=/app/storage TRUST_PROXY=1
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "--disable-warning=ExperimentalWarning", "server/server.js"]
