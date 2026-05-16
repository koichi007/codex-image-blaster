<img width="960" height="540" alt="image-blaster-1" src="https://github.com/user-attachments/assets/d294e420-eb48-4f00-b6a8-13005442d1a8" />

# Codex Image Blaster

Codex Image Blaster turns a single image into an explorable 3D web scene. Codex
drives the workflow, World Labs generates the static 3D space, and FAL-backed
providers can optionally generate movable object models and sound effects.

This project is a Codex-first adapter of
[neilsonnn/image-blaster](https://github.com/neilsonnn/image-blaster). The core
asset protocol, provider scripts, and Three.js viewer are intentionally kept
close to the original project; the main change is replacing the Claude
orchestrator layer with Codex instructions and repo skills.

Codex replaces the orchestrator, not the generation providers. World Labs, FAL,
Hunyuan, Meshy, and audio providers still perform the actual asset generation.

## What It Does

The recommended workflow is world-first:

1. Analyze a source image and create a project under `worlds/`.
2. Generate a clean plate by removing foreground objects from the source image.
3. Use World Labs Marble to generate the static 3D room as Gaussian splat
   assets (`.spz`) plus preview images and metadata.
4. Open the generated world in the browser viewer.
5. Optionally choose a small number of important objects and generate GLB/OBJ
   assets for interaction or placement.
6. Optionally generate ambience and object sound effects.

FAL object generation is powerful, but it is not the main product loop. For a
first pass, generate the 3D space, inspect it, then pick only the objects that
need to be movable, clickable, or replaced.

## Requirements

- Codex CLI
- [Bun](https://bun.sh/) for installing dependencies and running the viewer
- A World Labs API key for 3D world generation
- A FAL API key for clean plates, image edits, object models, and SFX

Provider calls can cost money. Codex is the orchestrator; it does not replace
World Labs, FAL, Hunyuan, Meshy, or audio generation providers.

## Quickstart

```bash
git clone https://github.com/exqqstar/codex-image-blaster
cd codex-image-blaster
bun install
cp .env.example .env
```

Edit `.env`:

```bash
WORLD_LABS_API_KEY=...
FAL_KEY=...
```

Put one image into `input/`, then run Codex from the repository root:

```bash
codex
```

Recommended first prompt:

```text
Use image-blast-project and image-blast-uncover for the image in input/.
Stop after analysis and show me the object candidates before calling providers.
```

Recommended world-only prompt:

```text
Generate the clean plate and World Labs world for this project. Do not generate
object GLBs or SFX yet.
```

Recommended selective-object prompt:

```text
Generate GLB assets only for the desk, chair, lamp, and plant. Use sequential
provider calls and stop if any provider returns an authorization or billing error.
```

Start the viewer:

```bash
bun run dev
```

Open the route printed by Vite, usually `http://localhost:5173/<world-slug>`.

## Costs And Defaults

This repo should be used conservatively:

- Start with World Labs world generation.
- Do not generate every detected object by default.
- Pick 1-4 high-value objects for GLB generation.
- Generate SFX last.
- Prefer sequential provider calls when testing new keys.

The common expensive mistake is approving every object candidate. A scene with
books, mugs, picture frames, boxes, furniture, plants, and props can quickly turn
into many image-edit and 3D-model calls. See [docs/COSTS.md](docs/COSTS.md).

## Documentation

- [Pipeline](docs/PIPELINE.md) explains the full image-to-world chain.
- [Troubleshooting](docs/TROUBLESHOOTING.md) covers FAL 403s, viewer controls,
  slow high-quality mode, and scene reset issues.
- [Costs](docs/COSTS.md) explains provider roles and cost-control habits.
- [AGENTS.md](AGENTS.md) documents the Codex project contract.

## Development

The first Codex adapter keeps using the existing `.claude/scripts/` provider
scripts so the core asset pipeline stays stable. Codex project instructions live
in `AGENTS.md`, and Codex repo skills live in `.agents/skills/`.

Useful commands:

```bash
bun run typecheck
WORLD_LABS_API_KEY=dummy FAL_KEY=dummy bun run test
bun run build
```

The dummy-key test run only verifies local behavior. Real generation requires
valid provider keys.

## Attribution

Codex Image Blaster is based on
[neilsonnn/image-blaster](https://github.com/neilsonnn/image-blaster). The goal
of this fork is to keep the original asset pipeline intact while making the
workflow natural for Codex users.
