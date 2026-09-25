#!/bin/bash
# Runs once, on first boot. Installs Docker, writes the compose file and the
# deploy script to disk, then runs the deploy script - the exact same script
# GitHub Actions re-runs remotely (over SSM) on every later push to main.
set -euxo pipefail

dnf install -y aws-cli docker
systemctl enable --now docker

# Docker's generic get.docker.com script doesn't recognize Amazon Linux
# ("Unsupported distribution 'amzn'"), so Docker Engine comes from AL2023's
# own dnf package above - but that package doesn't bundle the Compose v2 CLI
# plugin, so it's installed separately here.
mkdir -p /usr/local/lib/docker/cli-plugins
curl -fsSL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

mkdir -p /opt/todo-list

cat > /opt/todo-list/docker-compose.yml <<'COMPOSE_EOF'
${docker_compose_content}
COMPOSE_EOF

cat > /opt/todo-list/deploy.sh <<'DEPLOY_EOF'
${deploy_script_content}
DEPLOY_EOF

chmod 700 /opt/todo-list/deploy.sh
/opt/todo-list/deploy.sh
