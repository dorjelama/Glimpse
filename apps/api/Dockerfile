FROM node:20-alpine

RUN apk add --no-cache openssl

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace manifests first so dependency install is cached separately
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

# Copy API source after deps are cached
COPY apps/api ./apps/api

# Generate Prisma client then compile TypeScript
RUN pnpm --filter api prisma:generate
RUN pnpm --filter api build

WORKDIR /app/apps/api

ENV NODE_ENV=production
EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
