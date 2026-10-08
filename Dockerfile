# Ảnh chạy NutriWay cho VPS. Dùng output: "standalone" của Next nên ảnh cuối
# chỉ chứa file runtime cần thiết, không có mã nguồn và không có devDependencies.

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

# Chạy bằng người dùng thường, không phải root.
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Khoá bí mật (ACCESSTRADE_API_KEY…) truyền lúc chạy, KHÔNG đưa vào ảnh.
CMD ["node", "server.js"]
