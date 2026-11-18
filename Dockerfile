FROM nginx:1.27-alpine

# Cloud Run injects PORT (default 8080)
ENV PORT=8080

# nginx:alpine automatically runs envsubst on /etc/nginx/templates/*.template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Copy static site files
COPY . /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
