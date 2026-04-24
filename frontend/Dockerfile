FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Variables de entorno por defecto para el build
ENV VITE_API_URL=/api
ENV VITE_SOCKET_URL=/

RUN npm run build

# Etapa de producción con Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Redirigir el trafico a index.html para React Router
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://backend:3001/; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
