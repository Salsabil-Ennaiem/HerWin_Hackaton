FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy the files needed for dependency installation
COPY pyproject.toml uv.lock README.md ./

# Install dependencies only (not the project yet)
RUN uv sync --frozen --no-cache --no-install-project

# Copy the actual source code
COPY src/ ./src/

# Now install the project
RUN uv sync --frozen --no-cache

# Make the package discoverable
ENV PYTHONPATH=/app/src

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]