# AI Agent Skills

This directory contains **Agent Skills** following the [Agent Skills open standard](https://agentskills.io). Skills provide domain-specific patterns, conventions, and guardrails that help AI coding assistants (Claude Code, OpenCode, Cursor, etc.) understand project-specific requirements.

## What Are Skills?

[Agent Skills](https://agentskills.io) is an open standard format for extending AI agent capabilities with specialized knowledge. Originally developed by Anthropic and released as an open standard, it is now adopted by multiple agent products.

Skills teach AI assistants how to perform specific tasks. When an AI loads a skill, it gains context about:

- Critical rules (what to always/never do)
- Code patterns and conventions
- Project-specific workflows
- References to detailed documentation

## Setup

Run the setup script to configure skills for all supported AI coding assistants:

```bash
./skills/setup.sh
```

This creates symlinks so each tool finds skills in its expected location:

| Tool                   | Symlink Created   |
| ---------------------- | ----------------- |
| Claude Code / OpenCode | `.claude/skills/` |
| Codex (OpenAI)         | `.codex/skills/`  |
| GitHub Copilot         | `.github/skills/` |
| Gemini CLI             | `.gemini/skills/` |

After running setup, restart your AI coding assistant to load the skills.

## How to Use Skills

Skills are automatically discovered by the AI agent. To manually load a skill during a session:

```
Read skills/{skill-name}/SKILL.md
```

## Available Skills

### Wise Compare Hub Skills

Specialized patterns for NestJS Hexagonal Architecture with TDD:

| Skill              | Description                                 |
| ------------------ | ------------------------------------------- |
| `typescript`       | Const types, flat interfaces, utility types |
| `nestjs-10`        | NestJS framework, DI, modules, decorators   |
| `nestjs-hexagonal` | Hexagonal architecture, DDD, TDD patterns   |
| `jest`             | Unit and integration testing framework      |
| `axios`            | HTTP client for API calls and requests      |
| `supertest`        | E2E testing library for HTTP endpoints      |
| `playwright`       | Browser automation and E2E testing          |
| `typeorm`          | PostgreSQL ORM for database operations      |

## Directory Structure

```
skills/
├── {skill-name}/
│   ├── SKILL.md              # Required - main instrunsction and metadata
│   ├── scripts/              # Optional - executable code
│   ├── assets/               # Optional - templates, schemas, resources
│   └── references/           # Optional - links to local docs
└── README.md                 # This file
```

## Why Auto-invoke Sections?

**Problem**: AI assistants (Claude, Gemini, etc.) don't reliably auto-invoke skills even when the `Trigger:` in the skill description matches the user's request.

**Solution**: The `AGENTS.md` file contains an **Auto-invoke Skills** section that explicitly commands the AI: "When performing X action, ALWAYS invoke Y skill FIRST." This ensures skills are loaded at the right time.

For Wise Compare Hub, the Auto-invoke table is maintained in the main `AGENTS.md` file.

## About These Skills

This project uses eight carefully curated skills:

**Core Development Skills:**

1. **`typescript`** - Type safety patterns for strict TypeScript development
2. **`nestjs-10`** - NestJS framework patterns, dependency injection, modules, and decorators
3. **`nestjs-hexagonal`** - Complete patterns for NestJS with Hexagonal Architecture and TDD

**Database & Persistence Skills:**

4. **`typeorm`** - TypeORM patterns for PostgreSQL entities, repositories, and migrations

**Testing & HTTP Skills:**

5. **`jest`** - Unit and integration testing framework with mocking patterns
6. **`axios`** - HTTP client for API calls and external service integration
7. **`supertest`** - E2E testing library for HTTP endpoints and API contracts
8. **`playwright`** - Browser automation and E2E testing library for full user workflows

All skills include **CRITICAL sections** that require consulting the **Context7 MCP** before implementation. These skills are tailored specifically for the Wise Compare Hub project architecture and are referenced in the main `AGENTS.md` file.

## Design Principles

- **Concise**: Only include what AI doesn't already know
- **Progressive disclosure**: Point to detailed docs, don't duplicate
- **Critical rules first**: Lead with ALWAYS/NEVER patterns
- **Minimal examples**: Show patterns, not tutorials

## Resources

- [Agent Skills Standard](https://agentskills.io) - Open standard specification
- [Agent Skills GitHub](https://github.com/anthropics/skills) - Example skills
- [Claude Code Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) - Skill authoring guide
- [Wise Compare Hub AGENTS.md](../AGENTS.md) - Project-specific AI agent instructions
