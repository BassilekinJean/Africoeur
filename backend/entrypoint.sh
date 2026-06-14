#!/usr/bin/env bash
set -e

echo "→ Application des migrations Django..."
python manage.py migrate --noinput

echo "→ Collecte des fichiers statiques..."
python manage.py collectstatic --noinput || true

if [ "${SEED_DEMO:-false}" = "true" ]; then
  echo "→ Chargement des données de démonstration..."
  python manage.py seed_demo || true
fi

exec "$@"
