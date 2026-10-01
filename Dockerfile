FROM node:22-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci && \
    ROLLUP_VERSION="$(node -p "require('./node_modules/rollup/package.json').version")" && \
    npm install --no-save "@rollup/rollup-linux-$(node -p "process.arch")-gnu@${ROLLUP_VERSION}"

COPY apps/api/package*.json ./apps/api/
RUN npm --prefix apps/api ci

COPY apps/web ./apps/web
COPY apps/api ./apps/api

RUN npm run prisma:generate
RUN npm run build

FROM node:22-slim

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY apps/api/package*.json ./apps/api/
RUN npm --prefix apps/api ci --omit=dev

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/prisma.config.ts ./apps/api/prisma.config.ts
COPY --from=builder /app/apps/api/node_modules/.prisma ./apps/api/node_modules/.prisma
COPY --from=builder /app/apps/web/dist ./apps/web/dist

EXPOSE 3000

CMD ["node", "apps/api/dist/index.js"]
