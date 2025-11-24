# Use NGINX from your Nexus Docker Hosted registry
FROM nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085/library/nginx:alpine

# Remove default nginx web content
RUN rm -rf /usr/share/nginx/html/*

# Copy your website files
COPY . /usr/share/nginx/html
