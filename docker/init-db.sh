#!/bin/bash
set -e

echo "Starting database initialization..."

# Run migration files in order
for migration in /docker-entrypoint-initdb.d/migrations/*.sql; do
  if [ -f "$migration" ]; then
    echo "Running migration: $migration"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$migration"
  fi
done

echo "Migrations completed!"

# Run seed data
if [ -f "/docker-entrypoint-initdb.d/seeds/seed_data.sql" ]; then
  echo "Seeding database..."
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/seeds/seed_data.sql
  echo "Seeding completed!"
fi

echo "Database initialization complete!"
