# Smart Home Estimator — server image (Node 22, no npm packages needed)
# Build from the app folder:  docker build -f deploy/Dockerfile -t smart-home-estimator .
# Usually started with deploy/docker-compose.yml (adds HTTPS through Caddy).
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN rm -rf storage deploy README.md .htaccess \
 && mkdir -p storage && chown -R node:node storage
USER node
ENV NODE_ENV=production PORT=3000 STORAGE_DIR=/app/storage TRUST_PROXY=1
EXPOSE 3000
VOLUME /app/storage
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:3000/api/admin/me >/dev/null || exit 1
CMD ["node", "--disable-warning=ExperimentalWarning", "server/server.js"]
