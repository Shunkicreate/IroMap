locals {
  ruleset_name = "protect-${var.target_branch}"
}

resource "github_repository_ruleset" "branch_protection" {
  name        = local.ruleset_name
  repository  = var.repository
  target      = "branch"
  enforcement = "active"

  dynamic "bypass_actors" {
    for_each = toset(var.bypass_repository_role_ids)
    content {
      actor_type  = "RepositoryRole"
      actor_id    = bypass_actors.value
      bypass_mode = "pull_request"
    }
  }

  conditions {
    ref_name {
      include = ["refs/heads/${var.target_branch}"]
      exclude = []
    }
  }

  rules {
    deletion         = true
    non_fast_forward = true

    pull_request {
      dismiss_stale_reviews_on_push     = false
      require_code_owner_review         = false
      require_last_push_approval        = false
      required_approving_review_count   = 1
      required_review_thread_resolution = false
    }

    required_status_checks {
      strict_required_status_checks_policy = true

      dynamic "required_check" {
        for_each = toset(var.required_status_checks)
        content {
          context = required_check.value
        }
      }
    }
  }
}
