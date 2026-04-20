FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
ARG NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=
ARG NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=false
ARG NEXT_PUBLIC_ADMIN_WHATSAPP=6285609897497
ARG NEXT_PUBLIC_MINIO_URL=http://localhost:9000

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=$NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
ENV NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=$NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION
ENV NEXT_PUBLIC_ADMIN_WHATSAPP=$NEXT_PUBLIC_ADMIN_WHATSAPP
ENV NEXT_PUBLIC_MINIO_URL=$NEXT_PUBLIC_MINIO_URL

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001
CMD ["npm", "run", "start", "--", "-p", "3001"]
