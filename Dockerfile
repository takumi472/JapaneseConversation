FROM nginx:1.27-alpine

# Cloud Run injects PORT (default 8080)
ENV PORT=8080

# nginx:alpine automatically runs envsubst on /etc/nginx/templates/*.template
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Explicitly copy only public static site files (allowlist)
COPY index.html toc.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY assets/ /usr/share/nginx/html/assets/
COPY pages/ /usr/share/nginx/html/pages/

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
