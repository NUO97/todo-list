variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short name used to prefix and tag all resources"
  type        = string
  default     = "todo-list"
}

variable "instance_type" {
  description = "EC2 instance type running the app"
  type        = string
  default     = "t3.micro"
}

variable "github_repository" {
  description = "GitHub repository allowed to assume the deploy role, as \"owner/repo\""
  type        = string
  default     = "NUO97/todo-list"
}

variable "github_deploy_branch" {
  description = "Branch that is allowed to trigger deploys via OIDC"
  type        = string
  default     = "main"
}
