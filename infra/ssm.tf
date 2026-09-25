# JWT_SECRET is generated here (never typed/copy-pasted by hand) and stored as a
# SecureString. The EC2 instance role can read this one parameter; GitHub Actions
# never sees the value at all - see templates/deploy.sh.tpl.
resource "random_password" "jwt_secret" {
  length  = 48
  special = false
}

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/${var.project_name}/prod/JWT_SECRET"
  type  = "SecureString"
  value = random_password.jwt_secret.result

  tags = {
    Project = var.project_name
  }
}

data "aws_kms_alias" "ssm" {
  name = "alias/aws/ssm"
}
