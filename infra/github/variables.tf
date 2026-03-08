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
