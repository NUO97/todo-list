output "deploy_role_arn" {
  description = "Copy into the GitHub repo variable AWS_DEPLOY_ROLE_ARN"
  value       = aws_iam_role.github_deploy.arn
}

output "aws_region" {
  description = "Copy into the GitHub repo variable AWS_REGION"
  value       = var.aws_region
}

output "ecr_server_repository" {
  description = "Copy into the GitHub repo variable ECR_SERVER_REPOSITORY"
  value       = aws_ecr_repository.server.name
}

output "ecr_client_repository" {
  description = "Copy into the GitHub repo variable ECR_CLIENT_REPOSITORY"
  value       = aws_ecr_repository.client.name
}

output "ec2_instance_id" {
  description = "Copy into the GitHub repo variable EC2_INSTANCE_ID"
  value       = aws_instance.app.id
}

output "app_url" {
  description = "Public URL of the deployed app"
  value       = "http://${aws_eip.app.public_ip}"
}
