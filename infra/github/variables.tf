variable "owner" {
  type        = string
  description = "GitHub organization or user name."
  default     = "Shunkicreate"
}

variable "repository" {
  type        = string
  description = "Repository name."
  default     = "IroMap"
}

variable "target_branch" {
  type        = string
  description = "Target branch name to protect."
  default     = "main"
}

variable "required_status_checks" {
  type        = list(string)
  description = "Required status checks for pull requests."
  default     = ["quality-gate", "branch-name"]
}

variable "bypass_repository_role_ids" {
  type        = list(number)
  description = "Repository role IDs allowed to bypass pull request requirements."
  default     = [5]
}

variable "required_approving_review_count" {
  type        = number
  description = "Number of approving reviews required before merging a pull request (0-6)."
  default     = 0

  validation {
    condition     = var.required_approving_review_count >= 0 && var.required_approving_review_count <= 6
    error_message = "required_approving_review_count must be between 0 and 6."
  }
}
