---
name: workspace-reconciliation-rule
description: Enforces the clean reconciliation of the ZA.go.ke development repository and the mySpace Obsidian vault.
always: true
---

# Workspace Synchronization Protocol

## 1. Context Collection Phase
* Before executing any cross-directory updates, the agent must check the git status of both:
  - Project Directory: `C:\Users\mwiti\ZA.go.ke`
  - Knowledge Base: `C:\Users\mwiti\Downloads\Obsidian\mySpace`

## 2. Sync Execution Order
1. Analyze changes in the web development repository.
2. Formulate corresponding documentation items or architectural summaries.
3. Commit codebase changes locally using semantic commit syntax (e.g., `feat:`, `fix:`, `docs:`).
4. Stage, commit, and prepare the parallel push to the corresponding GitHub remotes.
