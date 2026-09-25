#!/bin/bash
# Pulls the latest images and (re)starts the app. Run on first boot by
# user_data, and re-run on every push to main via `aws ssm send-command`.
set -euxo pipefail

cd /opt/todo-list

aws ecr get-login-password --region ${aws_region} \
  | docker login --username AWS --password-stdin ${ecr_registry}

# Fetched fresh on every deploy; never written to disk, never baked into an image.
export JWT_SECRET
JWT_SECRET=$(aws ssm get-parameter \
  --name "${jwt_param_name}" \
  --with-decryption \
  --region ${aws_region} \
  --query "Parameter.Value" \
  --output text)

docker compose pull
docker compose up -d
docker image prune -f
