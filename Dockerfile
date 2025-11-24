# Use NGINX from Docker Hub
FROM nginx:alpine

# Remove default nginx web content
RUN rm -rf /usr/share/nginx/html/*

# Copy your static site into nginx html folder
COPY . /usr/share/nginx/html
