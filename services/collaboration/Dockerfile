FROM node:20-alpine

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY partykit.json tsconfig.json ./
COPY src ./src

EXPOSE 1999

CMD ["npx", "partykit", "dev", "--port", "1999"]
