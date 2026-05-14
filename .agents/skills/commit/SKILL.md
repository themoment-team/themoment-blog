---
name: git-commit
description: Use this skill whenever the user wants to create Git commits by splitting changes into logical units. Triggers include requests to commit changes, stage files, write commit messages, or organize Git history. Use when the user says "커밋해줘", "변경사항 커밋", "git commit", or asks to save/record their work in version control. Follows Korean commit message conventions with appropriate prefixes (add/update/fix/delete/docs/test/merge/init). Do NOT use for branching, merging, rebasing, or other Git operations unrelated to committing.
---

# Git Commit Guide

## Overview

Split changes into logical units and create focused Git commits. Each commit follows the single responsibility principle — never mix unrelated changes into one commit.

## Commit Message Rules

### Allowed Prefixes

| Prefix   | When to Use                                             |
|----------|---------------------------------------------------------|
| `add`    | New features, files, or dependencies                    |
| `update` | Improvements or modifications to existing functionality |
| `fix`    | Bug fixes                                               |
| `delete` | Removal of code, files, or features                     |
| `docs`   | Documentation changes                                   |
| `test`   | Adding or modifying tests                               |
| `merge`  | Branch merges                                           |
| `init`   | Project initialization                                  |

### Format Rules

- **Subject line only** — no commit body
- **Korean only** in commit messages
- **Do NOT add AI as co-author** (`Co-authored-by` is prohibited)
- Format: `<prefix>: <clear description of the change>`

```
add: 사용자 인증 미들웨어 추가
fix: 로그인 시 토큰 만료 오류 수정
update: 대시보드 컴포넌트 성능 개선
delete: 사용하지 않는 레거시 API 엔드포인트 제거
docs: README에 설치 가이드 작성
```

## Steps

### Step 1: Inspect Changes

```bash
git status
git diff
git diff --staged
```

### Step 2: Categorize into Logical Units

Group changes by the following criteria:

- Feature addition (new files, new functions)
- Bug fix (error resolution)
- Refactoring (code improvement without behavior change)
- Style change (formatting, indentation)
- Documentation update (README, comments)
- Test addition or modification
- Dependency change (package.json, requirements.txt)

### Step 3: Commit Each Group

For each logical unit, follow this sequence:

```bash
# Stage only the relevant files
git add <file1> <file2>

# Execute the commit
git commit -m "prefix: description of change"
```

### Step 4: Verify Results

```bash
git log --oneline -n <number of commits>
```

## Examples

### Single Feature Addition

```bash
git add src/auth/middleware.js src/auth/utils.js
git commit -m "add: JWT 기반 인증 미들웨어 추가"
```

### Mixed Bug Fix and Feature Addition

```bash
# Commit the bug fix first
git add src/api/login.js
git commit -m "fix: 로그인 실패 시 500 오류 반환 문제 수정"

# Commit the new feature separately
git add src/api/profile.js src/routes/profile.js
git commit -m "add: 사용자 프로필 조회 API 추가"
```

### Refactoring and Documentation

```bash
# Refactoring commit
git add src/utils/formatter.js
git commit -m "update: 날짜 포맷 유틸리티 함수 리팩터링"

# Documentation commit
git add README.md docs/api.md
git commit -m "docs: API 사용 예시 및 설치 방법 업데이트"
```

## Important Notes

- Never bundle unrelated changes into a single commit
- Each commit must be independently buildable and functional
- Use `git add .` or `git add -A` with caution to avoid staging unintended files
- Always run `git diff --staged` before committing to verify what is staged
