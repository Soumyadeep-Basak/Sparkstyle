.PHONY: help db-start db-stop db-shell migrate create-migration start

help:
	@echo "Available commands:"
	@echo "  db-start       - Start PostgreSQL database"
	@echo "  db-stop        - Stop PostgreSQL database"
	@echo "  db-shell       - Access PostgreSQL shell"
	@echo "  migrate        - Run database migrations"
	@echo "  create-migration - Create new migration"
	@echo "  start          - Run the FastAPI backend locally"

db-start:
	docker-compose -f docker-compose.dev.yml up -d

db-stop:
	docker-compose -f docker-compose.dev.yml down

db-shell:
	docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d sparkathon

migrate:
	cd backend && alembic upgrade head

create-migration:
	@read -p "Enter migration message: " msg; \
	cd backend && alembic revision --autogenerate -m "$$msg"

start:
	cd backend && chmod +x start.sh && ./start.sh
