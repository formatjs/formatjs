FROM mcr.microsoft.com/devcontainers/base:bookworm

# Download bazelisk and place it in $PATH
RUN wget https://github.com/bazelbuild/bazelisk/releases/download/v1.18.0/bazelisk-linux-amd64
RUN chmod +x bazelisk-linux-amd64
RUN mv bazelisk-linux-amd64 /usr/local/bin/bazel

# Install python3 and pip to setup pre-commit
RUN apt update && apt install -y --no-install-recommends \
    python3-setuptools \
    python3-pip \
    python3-dev \
    python3-venv

# Install pre-commit
RUN pip install --break-system-packages pre-commit
