FROM node:20-alpine AS base

WORKDIR /app

# Instalação de dependências
COPY package*.json ./
RUN npm install

# Cópia do código-fonte
COPY . .

# Execução da suíte de testes formais de integridade
RUN node tests/run_all.js

# Build da aplicação Next.js
RUN npm run build

# Exposição da porta padrão
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "start"]
