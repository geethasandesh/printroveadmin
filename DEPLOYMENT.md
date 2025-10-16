# PT-Admin Deployment Guide

## Environment Variables

The application requires the following environment variable to be set:

- `NEXT_PUBLIC_API_URL`: The base URL for the API backend

### Production Configuration

For production deployment, set:
```bash
NEXT_PUBLIC_API_URL=https://printrove-api.vizdale.com/api
```

### Local Development

For local development, set:
```bash
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

## Docker Deployment

The application includes a Dockerfile for containerized deployment. The default production API URL is set in the Dockerfile, but you can override it by setting the environment variable when running the container.

### Build and Run

```bash
# Build the Docker image
docker build -t pt-admin .

# Run the container
docker run -p 3000:3000 pt-admin

# Or with custom API URL
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=https://your-api-url.com/api pt-admin
```

## Recent Changes

- Fixed hardcoded localhost URLs throughout the application
- Created centralized API URL utility functions
- Updated all API calls to use the environment variable
- Added default production API URL in Dockerfile

The application will now properly connect to the production API when deployed.
