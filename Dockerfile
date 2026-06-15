FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Variables de entorno en build time (Expo las incrusta en el bundle)
ARG EXPO_PUBLIC_API_URL
ARG EXPO_PUBLIC_API_MODE=LIVE
ARG EXPO_PUBLIC_USE_MOCK=false
ARG EXPO_PUBLIC_VERSION=1.0.0

ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_API_MODE=$EXPO_PUBLIC_API_MODE
ENV EXPO_PUBLIC_USE_MOCK=$EXPO_PUBLIC_USE_MOCK
ENV EXPO_PUBLIC_VERSION=$EXPO_PUBLIC_VERSION

RUN npx expo export --platform web

# ---- runtime ----
FROM nginx:alpine

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
