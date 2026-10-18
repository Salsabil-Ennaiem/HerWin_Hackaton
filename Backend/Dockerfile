FROM python:3.13-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app
COPY pyproject.toml uv.lock README.md ./
RUN uv sync --frozen --no-cache --no-install-project
COPY src/ ./src/
COPY app/ ./app/
COPY seed/ ./seed/
RUN uv sync --frozen --no-cache
ENV PYTHONPATH=/app:/app/src
EXPOSE 8000
CMD ["uv", "run", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
