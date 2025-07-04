#!/bin/bash

echo "Building and starting Body Measurement API..."

if command -v docker-compose &> /dev/null; then
    echo "Using docker-compose..."
    docker-compose up --build
elif command -v docker &> /dev/null; then
    echo "Using docker..."
    docker build -t body-measure-api .
    docker run -p 8000:8000 -v "$(pwd)/weights:/app/weights" -v "$(pwd)/test:/app/test" body-measure-api
else
    echo "Error: Docker is not installed or not in PATH"
    exit 1
fi
