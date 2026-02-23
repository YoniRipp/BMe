# Frontend: multi-stage. Build with VITE_API_URL and VITE_GOOGLE_CLIENT_ID so the SPA works in production.
# Build context: frontend/ (e.g. docker build -t beme-frontend --build-arg VITE_API_URL=... --build-arg VITE_GOOGLE_CLIENT_ID=... ./frontend)

# Stage 1: build
FROM node:20-alpine AS build
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: serve static files
FROM node:20-alpine
WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/dist ./dist
COPY serve.json ./dist/serve.json
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# PORT is set by Railway at runtime; default for local runs.
ENV PORT=3000
EXPOSE 3000

# Entrypoint always sets PORT and passes a single listen token to serve so -l
# is never undefined (avoids "Unknown --listen endpoint scheme" crash).
# In Railway: do not set a custom Start Command, or use: /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
