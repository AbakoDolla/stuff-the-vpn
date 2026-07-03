#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/stuff-the-vpn"
REPO_URL="https://github.com/AbakoDolla/stuff-the-vpn.git"
BRANCH="main"

if [ ! -d "$APP_DIR" ]; then
  sudo mkdir -p "$APP_DIR"
fi

cd "$APP_DIR"
if [ ! -d .git ]; then
  sudo git clone --branch "$BRANCH" "$REPO_URL" .
else
  sudo git fetch origin "$BRANCH"
  sudo git checkout "$BRANCH"
  sudo git pull origin "$BRANCH"
fi

sudo cp docker/docker-compose.yml /tmp/docker-compose.yml
sudo docker compose up -d --build
