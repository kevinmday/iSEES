# syntax=docker/dockerfile:1.7
FROM node:24.7.0-bookworm-slim AS frontend-build
WORKDIR /build/isees-ui
COPY isees-ui/package.json isees-ui/package-lock.json ./
RUN npm ci
COPY isees-ui/index.html isees-ui/tsconfig.json isees-ui/tsconfig.app.json isees-ui/tsconfig.node.json isees-ui/vite.config.ts isees-ui/eslint.config.js ./
COPY isees-ui/public ./public
COPY isees-ui/src ./src
RUN npm run build

FROM python:3.12.11-slim-bookworm AS runtime
RUN useradd --create-home --uid 1000 user
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    ISEES_FRONTEND_DIR=/app/frontend \
    ISEES_CORS_ORIGINS=""
WORKDIR /app
COPY --chown=user:user isees_uap/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --requirement /app/requirements.txt
COPY --chown=user:user isees_uap /app/isees_uap
COPY --from=frontend-build --chown=user:user /build/isees-ui/dist /app/frontend
USER user
EXPOSE 7860
CMD ["/bin/sh", "-c", "exec uvicorn isees_uap.api:app --host 0.0.0.0 --port \"${PORT:-7860}\" --workers 1"]
