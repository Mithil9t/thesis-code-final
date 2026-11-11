#!/bin/sh
set -e
if ! command -v docker >/dev/null 2>&1; then
  echo 'Docker is required. Install Docker Desktop or Docker Engine with Compose.'
  exit 1
fi
cd "$(dirname "$0")"
docker compose up --build -d
printf '\nOpen http://localhost:8080 in your browser.\n'
printf 'Demo student: mithil@welcome.test / Student123!\n'
printf 'Demo admin: admin@welcome.test / Admin123!\n'
