FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run prisma:generate
RUN npm run build
RUN echo "Verifying path alias resolution..." && \
    if grep -rqE "require\(['\"]@(lib|config|middleware|routes)/|require\(['\"]@/types" dist/; then \
      echo "ERROR: Unresolved TypeScript path aliases in dist/:"; \
      grep -rnE "require\(['\"]@(lib|config|middleware|routes)/|require\(['\"]@/types" dist/; \
      exit 1; \
    fi && \
    echo "OK: all aliases resolved"

# Verify tsc-alias rewrote path aliases — fail the build if any remain
RUN if grep -r '"@config/' dist/ || grep -r '"@lib/' dist/ || grep -r '"@middleware/' dist/ || grep -r '"@routes/' dist/ || grep -r '"@/types' dist/; then \
      echo "ERROR: tsc-alias did not rewrite all path aliases in dist/" && exit 1; \
    else \
      echo "OK: all path aliases resolved"; \
    fi

# ---- runtime ----
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

CMD ["node", "dist/index.js"]
