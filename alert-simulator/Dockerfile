FROM node:20-alpine

WORKDIR /app

RUN npm init -y && npm install express

COPY server.js .
COPY public/ public/

EXPOSE 3333

CMD ["node", "server.js"]
