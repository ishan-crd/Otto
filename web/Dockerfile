# Otto web — API + dashboards, one long-running Node process.
# Build from the web/ directory:  docker build -t otto-web .
FROM node:22-alpine

WORKDIR /app
RUN corepack enable

# Install deps with the lockfile for reproducible builds.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

COPY tsconfig.json ./
COPY src ./src

ENV NODE_ENV=production
# Render/Railway inject PORT; the app reads it from the environment.
EXPOSE 8787

# tsx runs the TypeScript directly — same path as local `pnpm start`.
CMD ["pnpm", "start"]
