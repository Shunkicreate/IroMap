# GitHub Branch Protection IaC

This directory manages `main` branch protection using Terraform.

## Requirements

- Terraform 1.6+
- `GITHUB_TOKEN` with repository administration permission

## Usage

```bash
cd infra/github
terraform init
terraform plan
terraform apply
```

## Optional overrides

```bash
terraform plan \
  -var="owner=Shunkicreate" \
  -var="repository=IroMap" \
  -var="target_branch=main"
```
Default bypass actor is repository role ID `5` (`RepositoryRole`, admin) with `bypass_mode = "pull_request"`.

You can override role IDs as needed:

```bash
terraform plan -var='bypass_repository_role_ids=[5]'
```
