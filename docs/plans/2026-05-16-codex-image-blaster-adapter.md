# Codex Image Blaster Adapter Implementation Plan

> **For Codex:** Execute this plan task-by-task. Keep the existing app, worlds
> data protocol, and generation scripts intact unless a task explicitly says
> otherwise.

**Goal:** Adapt image-blaster so Codex can orchestrate the original image-blast
workflow through `AGENTS.md` and `.agents/skills`.

**Architecture:** Codex becomes the orchestration layer. The original
`.claude/scripts` Node entrypoints remain the generation backend for the first
adapter release. The React/R3F viewer continues to read local `worlds/` artifacts
through the existing Vite plugin.

**Tech Stack:** Codex repo instructions, Codex skills, Bun, Vite, React, React
Three Fiber, Node ESM scripts, World Labs, FAL.

## Goal Command

Use this objective for a long-running goal:

```text
Implement a Codex-native adapter for neilsonnn/image-blaster across Phase 1, Phase 2, Phase 3, and Phase 5: keep the existing app, worlds data protocol, and generation scripts intact; add AGENTS.md and .agents/skills so Codex can orchestrate the original image-blast workflow; update user-facing docs and viewer wording from Claude to Codex where needed; add or update tests that validate the Codex skill layer; run typecheck, tests with dummy provider keys, build, and audit/final reference checks. Defer the optional script directory migration from .claude/scripts to scripts unless it is necessary for correctness.
```

## Phase 1: Codex Orchestration Layer

Create `AGENTS.md` with setup, environment variables, world data protocol,
indexed artifact conventions, Codex workflow, viewer commands, and safety rules.

Create `.agents/skills/` entries for:

- `image-blast-project`
- `image-blast-uncover`
- `image-blast-world`
- `image-blast-3d`
- `image-blast-plate`
- `image-blast-sfx`
- `image-blast-image-edit`
- `image-blast-wildcard`

Each skill should describe the Codex-facing workflow and call the existing
`.claude/scripts` commands. Do not use Claude-only agent syntax in Codex skills.

## Phase 2: Minimum Codex Blast Path

Keep the original runtime path:

```text
input/ image
-> project-state
-> image analysis
-> image.json
-> object.json
-> optional clean plate
-> world generation
-> object 3D generation
-> SFX generation
-> viewer
```

Keep these script entrypoints stable:

```bash
node .claude/scripts/project/project-state.mjs
node .claude/scripts/world/generate-world.mjs
node .claude/scripts/asset-pipeline/generate-single-asset.mjs
node .claude/scripts/image-edit/generate-edit.mjs
node .claude/scripts/sfx/fal-elevenlabs-sfx.mjs
node .claude/scripts/project/ensure-local-assets.mjs
```

## Phase 3: Codex User Experience

Update README and viewer-facing copy so the primary workflow is Codex. Make clear
that Codex replaces the orchestrator, not the World Labs/FAL/ElevenLabs-style
provider APIs.

Update the local viewer terminal action from Claude to Codex. Preserve a
compatibility alias when practical.

## Phase 4: Deferred Script Directory Cleanup

Do not include this in the first long run unless required for correctness.

Potential later cleanup:

```text
.claude/scripts/
-> scripts/
```

This requires updating skills, docs, tests, and any hardcoded script references.

## Phase 5: Verification

Run:

```bash
bun run typecheck
WORLD_LABS_API_KEY=dummy FAL_KEY=dummy bun run test
bun run build
bun audit
```

Run reference checks:

```bash
rg "Agent\\(" .agents AGENTS.md README.md app/src app/vite.config.ts
rg "Open new Claude terminal|/__open-claude-terminal" app/src README.md AGENTS.md .agents
rg "Codex|codex|\\.agents|AGENTS.md" AGENTS.md README.md .agents app/src app/vite.config.ts
```

Expected final state:

- Codex instructions and skills exist.
- Codex skills call existing scripts.
- Tests validate the Codex adapter layer.
- Viewer exposes a Codex terminal action.
- Build and core tests pass.
- Any remaining Claude references are legacy compatibility or original-script
  paths, not the primary user workflow.

