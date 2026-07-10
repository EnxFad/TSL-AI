FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

RUN mkdir -p uploads

EXPOSE 3101

CMD ["sh", "-c", "npx prisma db push && npx prisma db seed && node dist/index.js"]
