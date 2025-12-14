# VSPrint - VS Code Print Extension - Punchlist Index

**Status**: Not Started
**Created**: 2025-12-14
**Last Updated**: 2025-12-14
**Estimated Duration**: 26 hours (~3-4 days)

## Quick Navigation

This punchlist is split into multiple parts to stay under token limits. **Always read the context file first.**

| File | Contents | Status |
|------|----------|--------|
| `PUNCHLIST_context.md` | Mission, decisions, prerequisites, architecture | READ FIRST |
| `PUNCHLIST_001.md` | Phases 1-2: MVP + Enhanced Formatting | Not Started |
| `PUNCHLIST_002.md` | Phases 3-4: Output Options + Customization | Not Started |
| `PUNCHLIST_003.md` | Phases 5-6: Advanced Features + Polish | Not Started |

## Overall Progress Summary

| Phase | Name | Status | Hours | Tickets |
|-------|------|--------|-------|---------|
| 1 | MVP Core Printing | [ ] | 4h | VSPRINT-001 to 004 |
| 2 | Enhanced Formatting | [ ] | 4h | VSPRINT-005 to 008 |
| 3 | Output Options | [ ] | 5h | VSPRINT-009 to 012 |
| 4 | Customization | [ ] | 4h | VSPRINT-013 to 015 |
| 5 | Advanced Features | [ ] | 5h | VSPRINT-016 to 019 |
| 6 | Polish & Integration | [ ] | 4h | VSPRINT-020 to 022 |
| **Total** | | **0%** | **26h** | **22 tickets** |

## How to Use This Punchlist

### Starting Fresh
1. Read `PUNCHLIST_context.md` for full project context
2. Open `PUNCHLIST_001.md` and begin with Phase 1
3. Follow tasks in order, checking boxes as you complete them
4. Update progress tracker after each task

### Resuming Work
1. Check this file's "Overall Progress Summary" table
2. Find the current phase (first with [ ] status)
3. Open the appropriate PUNCHLIST_00X.md file
4. Check "Current Phase" and "Next Action" in that file's tracker
5. Resume from "Next Action"

### After Each Phase
1. Mark phase complete in this file's table
2. Commit punchlist changes: `git add PUNCHLIST*.md && git commit -m "docs: update punchlist progress"`
3. Move to next phase in the next PUNCHLIST file

## Ticket Generation

After punchlist approval, generate all tickets in parallel:

```bash
# Run all 6 ticket-writer agents simultaneously
# Each handles one phase for focused, high-quality tickets

# Phase 1-2 (from PUNCHLIST_001.md)
ticket-writer punchlist=./PUNCHLIST_001.md phase=1 prefix=VSPRINT range=001-004
ticket-writer punchlist=./PUNCHLIST_001.md phase=2 prefix=VSPRINT range=005-008

# Phase 3-4 (from PUNCHLIST_002.md)
ticket-writer punchlist=./PUNCHLIST_002.md phase=3 prefix=VSPRINT range=009-012
ticket-writer punchlist=./PUNCHLIST_002.md phase=4 prefix=VSPRINT range=013-015

# Phase 5-6 (from PUNCHLIST_003.md)
ticket-writer punchlist=./PUNCHLIST_003.md phase=5 prefix=VSPRINT range=016-019
ticket-writer punchlist=./PUNCHLIST_003.md phase=6 prefix=VSPRINT range=020-022
```

Tickets will be created in `./docs/tickets/` with IDs VSPRINT-001 through VSPRINT-022.

## Key Metrics

- **Total Tasks**: ~85 checkable items across all phases
- **Total Files to Create**: ~35 source files
- **Estimated Test Count**: 92 tests
- **Target Coverage**: 80%+
- **Bundle Size Target**: <10MB

## Dependencies Between Phases

```
Phase 1 (MVP)
    |
    v
Phase 2 (Formatting) -----> Phase 3 (Output)
                                |
                                v
                           Phase 4 (Customization)
                                |
                                v
                           Phase 5 (Advanced)
                                |
                                v
                           Phase 6 (Polish)
```

Phases MUST be completed in order. Do not skip ahead.

---

## Parallel Execution Opportunities

Certain tickets within a phase can be worked on simultaneously using separate git worktrees. This enables faster completion by running multiple agents in parallel.

### Optimized Execution Graph

```
001 -> 002 -> 003 -> 004 -> 005 -+-> 006 --+-> 008 -+-> 009 -> 011 -> 012 -> 013 -> 014 -> 015 -+-> 016 -> 017 -+-> 020 -> 021 -> 022
                                 |         |        |                                           |              |
                                 +-> 007 --+        +-> 010 -----------------------------------+  +-> 018 -> 019 -+
```

### Parallel Ticket Pairs

| Phase | Parallel Tickets | Reason | Estimated Savings |
|-------|------------------|--------|-------------------|
| 2 | VSPRINT-006 + VSPRINT-007 | Both depend only on 005; 006=line wrapping/whitespace, 007=code intelligence | ~1 hour |
| 3 | VSPRINT-009 + VSPRINT-010 | Both depend only on 008; 009=PDF renderer, 010=HTML export | ~1.5 hours |
| 5 | VSPRINT-016 + VSPRINT-018 | Both depend only on 015; 016=git diff, 018=notebooks/markdown | ~1.5 hours |

**Total Estimated Time Savings**: ~3-4 hours with parallel execution

### Worktree Commands for Parallel Work

```bash
# Orchestration from project root: /home/richard/projects/vsprint

# Setup: Create worktrees for parallel tickets
cd /home/richard/projects/vsprint
git worktree add feat-006 -b feature/VSPRINT-006-line-wrapping dev
git worktree add feat-007 -b feature/VSPRINT-007-code-intelligence dev

# Agent 1 works in: /home/richard/projects/vsprint/feat-006
# Agent 2 works in: /home/richard/projects/vsprint/feat-007

# When both complete, create PRs targeting dev:
cd /home/richard/projects/vsprint/feat-006
git push -u origin feature/VSPRINT-006-line-wrapping
gh pr create --base dev --title "feat: VSPRINT-006 line wrapping"

cd /home/richard/projects/vsprint/feat-007
git push -u origin feature/VSPRINT-007-code-intelligence
gh pr create --base dev --title "feat: VSPRINT-007 code intelligence"

# After PRs merged to dev, cleanup worktrees:
cd /home/richard/projects/vsprint
git worktree remove feat-006
git worktree remove feat-007
cd dev && git pull origin dev
```

### Parallel Execution Rules

1. **MUST** complete prerequisite ticket before starting parallel pair
2. **MUST** use separate git worktrees to avoid conflicts
3. **SHOULD** coordinate merge order if any shared files exist
4. **MUST** run full test suite after merging parallel branches
