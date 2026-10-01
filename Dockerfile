# Build stage
FROM node:lts-alpine AS build
WORKDIR /app

# Install curl for debugging
RUN apk add --no-cache curl

COPY package*.json ./
RUN npm ci

COPY . .

ARG PUBLIC_WORDPRESS_API_BASE
ENV PUBLIC_WORDPRESS_API_BASE=$PUBLIC_WORDPRESS_API_BASE
# This helps if the server has trouble with its own SSL certificate during build
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# Debug: Try to connect to WordPress before building
RUN echo "Checking connection to $PUBLIC_WORDPRESS_API_BASE..." && \
    curl -v -I "$PUBLIC_WORDPRESS_API_BASE/wp-json/wp/v2/posts" || echo "Connection check failed, but proceeding with build..."

RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Install curl for healthcheck compatibility (e.g. Coolify)
RUN apk add --no-cache curl

# Copy Nginx server configuration
COPY default.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
