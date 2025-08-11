FROM mcr.microsoft.com/devcontainers/python:3.11

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - \
    && sudo apt-get install -y nodejs

# Install additional tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    vim \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Docker CLI
RUN curl -fsSL https://get.docker.com | sh

# Set up workspace
WORKDIR /workspace

# Install Python development tools
RUN pip install --upgrade pip \
    && pip install black flake8 pylint pytest

USER vscode