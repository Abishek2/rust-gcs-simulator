FROM rust:1.85-slim AS builder

WORKDIR /app

# Copy the Cargo manifests
COPY Cargo.toml Cargo.lock ./

# Create a dummy src/main.rs to build dependencies and cache them
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Copy the actual source code
COPY src ./src
# Touch the file to ensure cargo sees it as modified
RUN touch src/main.rs
RUN cargo build --release

# Create the final runtime image
FROM debian:bookworm-slim

# Install necessary libraries (like OpenSSL and CA certificates)
RUN apt-get update && apt-get install -y libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the built binary
COPY --from=builder /app/target/release/gcs-backend /usr/local/bin/gcs-backend

# Default configuration via environment variables
ENV GCS_HOST=0.0.0.0
ENV GCS_PORT=3001
ENV GCS_LOG_LEVEL=info

# Expose the backend port
EXPOSE 3001

# Command to run the application
CMD ["gcs-backend"]
