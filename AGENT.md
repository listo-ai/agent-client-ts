# AGENT.md — agent-client-ts

TypeScript HTTP client for the Listo AI agent REST API (`@listo/agent-client` on npm).

---

## Skills

See [SKILLS/ts.md](../SKILLS/ts.md) for the full skill map.

Quick reference for this repo:

| Task | Skill path |
|------|------------|
| Building / modifying API client | `~/.agents/skills/frontend-ui-engineering/SKILL.md` |
| HTTP client / API design | `~/.agents/skills/api-and-interface-design/SKILL.md` |
| TDD | `~/.agents/skills/test-driven-development/SKILL.md` |
| Debugging | `~/.agents/skills/debugging-and-error-recovery/SKILL.md` |
| Security | `~/.agents/skills/security-and-hardening/SKILL.md` |
| Code review | `~/.agents/skills/code-review-and-quality/SKILL.md` |

---

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Package manager**: `pnpm`
- **Registry**: npm (`@listo/agent-client`)
- **Runtime**: Node.js + browser (ESM)
- **Test runner**: Vitest
- **Build**: `tsc`

## Reference implementations

| Repo | Language | Path |
|------|----------|------|
| `agent-client-rs` | Rust | `../agent-client-rs/` |
| `agent-client-dart` | Dart | `../agent-client-dart/` |

Check both when implementing a new API method — endpoint shape, request/response types, and error handling must be consistent across all clients.

## Workspace commands

```bash
pnpm install          # fetch dependencies
pnpm build            # compile TypeScript
pnpm typecheck        # type-check without emit
pnpm test             # run tests via Vitest
pnpm lint             # ESLint
pnpm publish --dry-run  # check publishability
```

## Conventions

- Strict TypeScript — no `any` on public API surface.
- All public types and functions must have JSDoc comments.
- Error types in `errors.ts` — mirror shapes from Rust client where possible.
- ESM only — no CommonJS.
- Generated types in `src/generated/` are not hand-edited; regenerate from the spec.
