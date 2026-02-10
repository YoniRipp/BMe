# Frontend: multi-stage. Build with VITE_API_URL so the SPA calls the correct API at runtime.
# Build context: frontend/ (e.g. docker build -t beme-frontend --build-arg VITE_API_URL=http://localhost:3000 ./frontend)

# Stage 1: build
FROM node:20-alpine AS build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
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

ENV PORT=3000
EXPOSE 3000

CMD ["sh", "-c", "npx serve dist -s -l ${PORT}"]
