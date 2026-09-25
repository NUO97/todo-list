data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# AWS-published pointer to the latest standard AL2023 AMI. A name filter like
# "al2023-ami-*" also matches the ECS/Neuron variants (30GB root snapshots).
data "aws_ssm_parameter" "al2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

# Only HTTP is exposed. There is no SSH rule and no key pair anywhere in this
# config - shell access, if ever needed, is via `aws ssm start-session`.
resource "aws_security_group" "app" {
  name        = "${var.project_name}-app"
  description = "Allow inbound HTTP only; remote access is via SSM Session Manager"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-app"
  }
}

locals {
  ecr_registry = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
}

resource "aws_instance" "app" {
  ami                    = data.aws_ssm_parameter.al2023.value
  instance_type          = var.instance_type
  subnet_id              = data.aws_subnets.default.ids[0]
  vpc_security_group_ids = [aws_security_group.app.id]
  iam_instance_profile   = aws_iam_instance_profile.app.name

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = templatefile("${path.module}/templates/user_data.sh.tpl", {
    docker_compose_content = templatefile("${path.module}/templates/docker-compose.prod.yml.tpl", {
      ecr_registry = local.ecr_registry
      server_repo  = aws_ecr_repository.server.name
      client_repo  = aws_ecr_repository.client.name
    })
    deploy_script_content = templatefile("${path.module}/templates/deploy.sh.tpl", {
      aws_region     = var.aws_region
      ecr_registry   = local.ecr_registry
      jwt_param_name = aws_ssm_parameter.jwt_secret.name
    })
  })

  tags = {
    Name = "${var.project_name}-app"
  }
}

resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-app"
  }
}
