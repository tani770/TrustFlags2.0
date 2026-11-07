# Multi-stage container for TrustFlags CLI, GitHub Action, and Webhook Server
FROM python:3.11-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install security utilities and build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY pyproject.toml .
RUN pip install --upgrade pip && \
    pip install . bandit ruff radon PyGithub rich fastapi uvicorn

# Copy application source
COPY trustflags/ ./trustflags/

# Install the package in editable/local mode
RUN pip install -e .

# Expose webhook port
EXPOSE 8000

# Default entrypoint runs trustflags CLI
ENTRYPOINT ["trustflags"]
CMD ["scan", "."]
