FROM node:20-alpine

WORKDIR /app

# Archivos comunes si se usa un monorepo, pero asumimos el backend independiente por simplicidad
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Generar cliente prisma
RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
