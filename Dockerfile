# Build stage
FROM node:lts-alpine AS build
WORKDIR /app

# Install curl for debugging
RUN apk add --no-cache curl

COPY package*.json ./
RUN npm ci

COPY . .

# Generate the nginx 301 map for URLs that moved to aichieve.net during the split. Must run
# after COPY . . (it reads src/data/ownership.mjs) and before the nginx stage copies it out.
# Derive ownership from the LIVE CMS before anything reads it. This is what makes a publish
# actually appear: the redeploy re-derives the post list instead of trusting a committed one.
# Must precede the redirect generation, which reads the derived file.
RUN node scripts/routing.mjs
RUN node scripts/generate-nginx-redirects.mjs

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

# The generated 301 map for moved URLs. Deliberately NOT under conf.d/ — nginx auto-includes
# conf.d/*.conf at the http level, where a bare `location` is a syntax error. default.conf
# includes it explicitly from inside its server block.
COPY --from=build /app/nginx-redirects.conf /etc/nginx/redirects.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
