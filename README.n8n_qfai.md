# n8n_qfai - Custom n8n Build

This is a custom n8n build with QuikFame AI enhancements.

## Building the Custom Docker Image

### Prerequisites

1. Make sure you have Docker installed
2. Build the n8n application first

### Build Steps

1. **Build the n8n application:**
   ```bash
   pnpm run build:n8n
   ```

2. **Build the custom Docker image:**
   ```bash
   pnpm run build:docker:qfai
   ```

   This will create a Docker image named `n8n_qfai:latest`

3. **Build and Push to Docker Hub (One Command):**
   ```bash
   pnpm run build:push:qfai
   ```

   Or manually:
   ```bash
   docker login
   docker push hamzaelkmntn/n8n_qfai:latest
   ```

## Using in Your Other Repository

Update your other repository's `docker-compose.yml` to use the custom image:

```yaml
services:
  n8n:
    image: hamzaelkmntn/n8n_qfai:latest
    # ... rest of your configuration
```

## Environment Variables

The custom build supports all standard n8n environment variables plus:

- `CREATIVE_SUITE_API_URL` - URL for Creative Suite API
- `CREATIVE_SUITE_API_KEY` - API key for Creative Suite
- `NODE_TLS_REJECT_UNAUTHORIZED=0` - For local development with self-signed certificates

## Custom Configuration

The build includes:
- Custom entrypoint script for certificate handling
- Task runner configuration for JavaScript execution
- Support for Creative Suite API integration
- PostgreSQL database configuration

## Development

For local development, you can use the provided `docker-compose.n8n_qfai.yml`:

```bash
docker-compose -f docker-compose.n8n_qfai.yml up
```

This will start:
- n8n_qfai on port 5678
- PostgreSQL database (neon-local)
- Nginx proxy on port 5679

## Access

- **n8n Interface:** http://localhost:5678
- **Default Login:** admin@mountain.com / quikFame@mntn!25
- **Webhook Proxy:** http://localhost:5679

## Registry Options

Popular private Docker registries you can use:
- **AWS ECR:** `123456789012.dkr.ecr.us-east-1.amazonaws.com/n8n_qfai:latest`
- **Google Container Registry:** `gcr.io/your-project/n8n_qfai:latest`
- **Azure Container Registry:** `yourregistry.azurecr.io/n8n_qfai:latest`
- **Docker Hub Private:** `your-username/n8n_qfai:latest`
- **GitHub Container Registry:** `ghcr.io/your-username/n8n_qfai:latest`
