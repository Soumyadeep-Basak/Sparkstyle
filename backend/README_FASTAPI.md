# Sparkathon FastAPI Backend

This backend has been converted from Flask to FastAPI for improved performance and modern API development.

## Features

- **FastAPI**: Modern, fast (high-performance) web framework
- **SQLAlchemy**: Database ORM for PostgreSQL
- **Pydantic**: Data validation using Python type hints
- **CORS**: Cross-origin resource sharing support
- **File Upload**: Image upload functionality for users and products
- **Body Measurement API**: Integrated body measurement endpoints

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=postgres
export POSTGRES_DB=sparkathon
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
```

3. Initialize the database:
```bash
python init_db.py
```

## Running the Application

### Main Application (includes all APIs)
```bash
# Using uvicorn directly
uvicorn app:app --reload --host 0.0.0.0 --port 8000

# Using the startup script
python main.py
```

### Body Measurement API Only
```bash
python body_measure_api.py
```

## API Endpoints

### General
- `GET /` - Welcome message
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - ReDoc documentation

### Users
- `POST /users` - Create a new user
- `GET /users` - List all users
- `POST /users/{user_id}/upload_image` - Upload user image

### Products
- `POST /products` - Create a new product
- `GET /products` - List all products
- `POST /products/{product_id}/upload_image` - Upload product image

### Files
- `GET /uploads/{filename}` - Serve uploaded files

### Body Measurement (if available)
- `POST /body-measure/predict-mediapipe` - MediaPipe body measurement
- `POST /body-measure/predict-yolo` - YOLO body measurement
- `POST /body-measure/detect-fullbody` - Full body detection
- `POST /body-measure/predict-avg` - Average prediction

## Key Changes from Flask

1. **Framework**: Replaced Flask with FastAPI
2. **Database**: Direct SQLAlchemy instead of Flask-SQLAlchemy
3. **Validation**: Pydantic models for request/response validation
4. **File Handling**: FastAPI's UploadFile instead of Flask's file handling
5. **Async Support**: Native async/await support
6. **Documentation**: Automatic OpenAPI/Swagger documentation
7. **Type Hints**: Full type annotation support
8. **Error Handling**: HTTPException for better error responses

## Development

The application supports hot reload during development. Access the interactive API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Database

The application uses PostgreSQL with SQLAlchemy. Tables are automatically created on startup.

## File Uploads

Images are stored in the `uploads/` directory with UUID-based naming for security.
