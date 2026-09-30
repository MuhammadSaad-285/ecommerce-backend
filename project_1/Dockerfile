FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["node", "project1.js"]