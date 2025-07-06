#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."
while ! nc -z localhost 5432; do
  sleep 1
done

echo "PostgreSQL is ready!"

echo "Running database migrations..."
alembic upgrade head

echo "Starting FastAPI application..."
exec uvicorn app:app --host 0.0.0.0 --port 8000 --reload
