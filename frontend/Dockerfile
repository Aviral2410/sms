FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY tsconfig.json tsconfig.app.json vite.config.ts index.html ./
COPY src ./src
RUN npm install
RUN npm run build

FROM nginx:1.27-alpine
RUN apk add --no-cache gettext
COPY infra/nginx/default.conf /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 3000
CMD ["/bin/sh", "-c", "envsubst '$$FRONTEND_PORT $$GATEWAY_PUBLIC_BASE_URL $$MCP_PUBLIC_BASE_URL' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
