FROM node:20-alpine AS build

WORKDIR /app
COPY package.json ./
COPY pnpm-lock.yaml* ./
RUN corepack enable && pnpm install
COPY tsconfig.json ./
COPY src ./src
RUN pnpm run build

FROM node:20-alpine AS runtime

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
RUN corepack enable && pnpm install --prod
COPY --from=build /app/dist ./dist

USER appuser
EXPOSE 3002

CMD ["node", "dist/server.js"]
