# Usar a imagem oficial do Node.js
FROM node:18

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos do projeto
COPY package*.json ./
RUN npm install

COPY . .

# Expor a porta da aplicação
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["node", "server.js"]

