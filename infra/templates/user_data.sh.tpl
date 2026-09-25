#!/bin/bash
# Runs once, on first boot. Installs Docker, writes the compose file and the
# deploy script to disk, then runs the deploy script - the exact same script
# GitHub Actions re-runs remotely (over SSM) on every later push to main.
set -euxo pipefail

dnf install -y aws-cli
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

mkdir -p /opt/todo-list

cat > /opt/todo-list/docker-compose.yml <<'COMPOSE_EOF'
${docker_compose_content}
COMPOSE_EOF

cat > /opt/todo-list/deploy.sh <<'DEPLOY_EOF'
${deploy_script_content}
DEPLOY_EOF

chmod 700 /opt/todo-list/deploy.sh
/opt/todo-list/deploy.sh
