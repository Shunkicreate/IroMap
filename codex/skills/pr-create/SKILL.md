---
name: pr-create
description: Review changes against develop and create or update draft pull requests with GitHub CLI for this repository. Use when asked to generate a PR from `git diff develop...HEAD`, create a draft PR, push then create PR (`-p`), or update only an existing PR body (`-u`) while following `.github/pull_request_template.md` exactly.
---

# PR Create

## Overview

Create or update a pull request by using change evidence between `develop` and `HEAD`.
Generate Japanese PR text in the repository template format and execute the corresponding `gh` command.

## Allowed Command Scope

Use only:
- `git *`
- `gh *`

Do not use other command families unless the user explicitly changes the rule.

## Inputs To Collect

Always collect these before generating PR text:
- `git status`
- `git diff develop...HEAD`
- `git log --oneline develop..HEAD`
- `.github/pull_request_template.md`

If PR already exists (`-u`), also collect:
- `gh pr view --json number,title,body,headRefName,baseRefName`

## Mode Selection

Interpret options as follows.

1. Default (no option)
- Generate PR title/body from `develop...HEAD` diff.
- Create draft PR with `gh pr create --draft`.

2. `-p`
- Push current branch first: `git push -u origin <current-branch>`.
- Generate PR title/body from `develop...HEAD` diff.
- Create draft PR with `gh pr create --draft`.

3. `-u`
- Generate PR body from `develop...HEAD` diff.
- Update existing PR body only with `gh pr edit --body <description>`.

## PR Body Rules

Follow `.github/pull_request_template.md` exactly.

Additional mandatory rules:
- Add `🤖 Generated with Claude Code` at the very top.
- Write PR title and body in Japanese by default.
- Keep template headings/check item labels as-is when they are defined in English.
- Fill free-text content (`Summary` bullets and notes) in Japanese.
- Keep section order and checklist style exactly as template.
- Fill checkboxes based on evidence. Do not guess.

## Title Rules

Create concise, concrete Japanese title from the main user-impacting change.
Avoid vague titles like 「修正対応」 or 「各種更新」.

## Execution Procedure

1. Identify current branch and confirm base branch is `develop`.
2. Gather required inputs from Git history and diff.
3. Draft title and body in template format.
4. If diff is complex, add a Mermaid diagram section that clarifies flow or structure.
5. Execute command for selected mode.

Default mode command:
```bash
gh pr create --base develop --head <current-branch> --draft --title "<title>" --body "<description>"
```

`-p` mode commands:
```bash
git push -u origin <current-branch>
gh pr create --base develop --head <current-branch> --draft --title "<title>" --body "<description>"
```

`-u` mode command:
```bash
gh pr edit --body "<description>"
```

## Guardrails

Do not claim tests passed unless logs confirm it.
Do not mark unchecked template items as done without file evidence.
Do not create non-draft PRs.
If `gh pr create` fails because a PR already exists, switch to update flow and run `gh pr edit --body`.
