# Body Measurement API Docker Setup

## Prerequisites
- Docker
- Docker Compose

## Quick Start

### Build and run with Docker Compose
```bash
docker-compose up --build
```

### Build and run with Docker only
```bash
docker build -t body-measure-api .
docker run -p 8000:8000 -v $(pwd)/weights:/app/weights -v $(pwd)/test:/app/test body-measure-api
```

## API Endpoints

The API will be available at `http://localhost:8000`

- `/predict-mediapipe` - Body measurements using MediaPipe
- `/predict-yolo` - Body measurements using YOLOv8
- `/predict-avg` - Average of both methods
- `/detect-fullbody` - Full body detection

## API Documentation

Once running, visit `http://localhost:8000/docs` for interactive API documentation.

## Stopping the container

```bash
docker-compose down
```
