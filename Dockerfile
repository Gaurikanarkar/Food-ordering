# Use NGINX from Nexus instead of Docker Hub
FROM nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085/library/nginx:alpine

# Remove default nginx web content
RUN rm -rf /usr/share/nginx/html/*

# Copy your static site into nginx html folder
COPY . /usr/share/nginx/html
