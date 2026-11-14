FROM node:22-alpine AS base

WORKDIR /app

# Instalação de dependências
COPY package*.json ./
RUN npm install

# Cópia do código-fonte completo
COPY . .

# Build da aplicação Next.js (valida TypeScript e compila páginas de produção)
RUN npm run build

# Exposição da porta padrão
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "start"]
