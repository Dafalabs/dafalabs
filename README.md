# dafalabs

`dafalabs.com` — marketing site, blog and contact form.

## Layout

```
web/    Next.js — the site (pages under app/[locale]/, one file per page, two languages)
api/    FastAPI — endpoints in app/routers/, business rules in app/services/
media/  uploaded images, bind-mounted into the container
```

## Running locally

```bash
docker compose -f docker-compose.local.yml up --build
```

- Site: http://localhost:8080
- API: http://localhost:8001
- Postgres: `localhost:5433`, user/password/database all `dafalabs`

For frontend-only work, `cd web && npm install && npm run dev` is enough.

## First admin account

```bash
docker exec -it dafalabs-api python manage.py create-admin admin@dafalabs.com "Your Name"
```

## Tests

```bash
cd api
docker run --rm -v "$PWD":/code -w /code python:3.12-slim \
  sh -c "pip install -q -r requirements.txt -r requirements-dev.txt && pytest"
```
