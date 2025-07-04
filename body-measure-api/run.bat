@echo off
echo Building and starting Body Measurement API...

where docker-compose >nul 2>nul
if %errorlevel% == 0 (
    echo Using docker-compose...
    docker-compose up --build
) else (
    where docker >nul 2>nul
    if %errorlevel% == 0 (
        echo Using docker...
        docker build -t body-measure-api .
        docker run -p 8000:8000 -v "%cd%/weights:/app/weights" -v "%cd%/test:/app/test" body-measure-api
    ) else (
        echo Error: Docker is not installed or not in PATH
        exit /b 1
    )
)
