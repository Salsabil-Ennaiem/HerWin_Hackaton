# Frontend/Dockerfile

# ---- Build stage ----
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the code
COPY . .

# Google OAuth client ID is public and embedded in the frontend bundle.
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Build the production version
RUN npm run build

# ---- Production stage ----
FROM nginx:alpine

# Copy the built files to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Optional: better SPA routing (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]