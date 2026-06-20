FROM node:20-slim AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Pass build arguments to environment variables so Vite can bake them into the build
ARG VITE_API_BASE_URL=http://localhost:3001
ARG VITE_WS_URL=ws://localhost:3001/ws/telemetry

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Build the frontend
RUN npm run build

# Use a lightweight node image to serve the preview
FROM node:20-slim

WORKDIR /app

# We only need the dist folder, package.json and node_modules to run preview
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Expose Vite preview port
EXPOSE 4173

# Start the preview server and expose to all network interfaces
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]