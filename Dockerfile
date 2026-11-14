FROM node:22-alpine AS base

WORKDIR /app

# Instalação de dependências
COPY package*.json ./
RUN npm install

# Cópia do código-fonte completo
COPY . .

# Execução segura da suíte de testes formais de integridade se existir
RUN if [ -f tests/run_all.js ]; then node tests/run_all.js; else echo "Nenhum teste encontrado, prosseguindo com o build"; fi

# Build da aplicação Next.js
RUN npm run build

# Exposição da porta padrão
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "start"]
