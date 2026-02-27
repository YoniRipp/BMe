# Backend: Node 20, no build step. Build context should be backend/ (e.g. docker build -t beme-backend ./backend)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .
EXPOSE 3000

CMD ["node", "index.js"]
