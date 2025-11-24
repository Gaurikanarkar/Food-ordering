# Use NGINX from Nexus Docker Proxy instead of Docker Hub
FROM nexus-service-for-docker-proxy.nexus.svc.cluster.local:8085/library/nginx:alpine

# Remove default nginx web content
RUN rm -rf /usr/share/nginx/html/*

# Copy your website
COPY . /usr/share/nginx/html