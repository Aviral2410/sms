FROM node:22-alpine
WORKDIR /app

COPY services/mcp-server/package.json ./
RUN npm install

COPY services/mcp-server/src ./src

ENV PORT=8084
EXPOSE 8084

CMD ["npm", "start"]
