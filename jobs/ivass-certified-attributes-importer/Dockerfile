
FROM node:18-alpine AS base

FROM base AS builder
RUN apk add --no-cache libc6-compat
RUN apk update

# Set working directory
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm --package=turbo dlx turbo prune --scope=ivass-certified-attributes-importer --docker

# remove all empty node_modules folder structure
RUN rm -rf /app/out/full/*/*/node_modules

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN corepack enable
RUN pnpm install --frozen-lockfile

# Install dependencies for Puppeteer
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Add user so we don't need --no-sandbox.
RUN addgroup -S pptruser && adduser -S -G pptruser pptruser

# Build the project
COPY --from=builder /app/out/full/ .

RUN chown -R pptruser:pptruser /app
 
# Run everything after as non-privileged user.
USER pptruser

RUN pnpm dlx turbo run build --filter=ivass-certified-attributes-importer

CMD node ./jobs/ivass-certified-attributes-importer/dist
