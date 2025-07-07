#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."
while ! timeout 1 bash -c 'cat < /dev/null > /dev/tcp/localhost/5432' 2>/dev/null; do
  sleep 1
done

echo "PostgreSQL is ready!"

echo "Running database migrations..."
alembic upgrade head

echo "Starting FastAPI application..."
exec uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
