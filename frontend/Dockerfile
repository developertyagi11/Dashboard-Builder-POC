FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx config:
#   /api/* → proxy to backend service (Docker internal hostname)
#   /*     → SPA fallback to index.html
RUN printf '\
server {\n\
  listen 80;\n\
  root /usr/share/nginx/html;\n\
\n\
  location /api/ {\n\
    proxy_pass http://backend:3001/api/;\n\
    proxy_http_version 1.1;\n\
    proxy_set_header Host $host;\n\
    proxy_set_header X-Real-IP $remote_addr;\n\
    proxy_read_timeout 30s;\n\
  }\n\
\n\
  location /health-backend {\n\
    proxy_pass http://backend:3001/health;\n\
  }\n\
\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
