#!/bin/bash
# Database initialization script
# This script runs migrations and seeds the database

set -e

echo "Starting database initialization..."

# Wait for database to be ready
echo "Waiting for database to be ready..."
until pg_isready -h ${DB_HOST:-database} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} 2>/dev/null; do
  echo "Database is not ready yet. Waiting..."
  sleep 2
done

echo "Database is ready!"

# Run migrations
echo "Running database migrations..."
for migration in /app/migrations/*.sql; do
  if [ -f "$migration" ]; then
    echo "Running migration: $migration"
    PGPASSWORD=${DB_PASSWORD:-postgres} psql -h ${DB_HOST:-database} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -d ${DB_NAME:-saas_db} -f "$migration"
  fi
done

echo "Migrations completed!"

# Run seeds
echo "Seeding database..."
if [ -f "/app/seeds/seed_data.sql" ]; then
  PGPASSWORD=${DB_PASSWORD:-postgres} psql -h ${DB_HOST:-database} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -d ${DB_NAME:-saas_db} -f /app/seeds/seed_data.sql
  echo "Seeding completed!"
else
  echo "No seed file found, skipping seeding."
fi

echo "Database initialization complete!"

# Start the application
echo "Starting the application..."
exec node src/index.js
