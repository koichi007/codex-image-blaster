# Codex Image Blaster

This repository is a Codex-native adapter for image-blaster. Codex replaces the
orchestrator role that the original Claude skills performed, while the existing
asset protocol, React viewer, and generation scripts stay intact.

## Setup

1. Run `bun install` from the repository root.
2. Copy `.env.example` to `.env`.
3. Set `WORLD_LABS_API_KEY` for World Labs world generation.
4. Set `FAL_KEY` for FAL-backed image editing, 3D objects, and SFX.

Codex can drive the workflow, but Codex does not replace provider APIs. World
Labs, FAL, Meshy, Hunyuan, and ElevenLabs-style SFX generation still require the
provider credentials expected by the scripts.

## Keep The Core Pipeline Stable

Do not rewrite the app, data protocol, or provider scripts unless the user asks
for that explicitly. The Codex adapter should keep using the current script
entrypoints:

```bash
node .claude/scripts/project/project-state.mjs
node .claude/scripts/world/generate-world.mjs
node .claude/scripts/asset-pipeline/generate-single-asset.mjs
node .claude/scripts/image-edit/generate-edit.mjs
node .claude/scripts/sfx/fal-elevenlabs-sfx.mjs
node .claude/scripts/project/ensure-local-assets.mjs
```

The `.claude/scripts` path is intentionally preserved in the first Codex-native
version. Moving scripts into a generic `scripts/` directory is a separate cleanup
phase and should not be mixed into ordinary workflow fixes.

## Directory Protocol

```text
input/

worlds/
  <world-slug>/
    project.json
    scene.json
    image.json
    source/
      0-<slug>.<ext>
      <image>.json
    output/
      world/
      sfx/
      <object-slug>/
        object.json
        sfx/
```

`source/` holds stable source images, clean plates, and image analysis JSON.
`output/world/` holds World Labs assets. `output/<object-slug>/` holds object
intent, reference images, models, and object SFX. `scene.json` is the viewer
placement state.

Generated assets are disk-first. Provider URLs in JSON and request metadata are
provenance and resume data; the frontend should load local `/worlds/...` files.

## Indexed Artifact Convention

Generated files use this convention:

```text
N-slug.ext
.N-slug-request.json
.N-slug__scope-request.json
```

`N` is the generation index. `0` is usually the original source image. Hidden
request JSON files sit beside the generated artifacts and store provider request
state, resumability metadata, downloaded files, and stripped provider responses.

## Codex Workflow

When the user asks to image-blast an input image:

1. Inspect project state and `input/`.
2. Initialize or inspect the world project:

   ```bash
   node .claude/scripts/project/project-state.mjs --world "<slug>" --stage-input
   ```

3. If source images exist and `image.json` is missing, use the
   `image-blast-uncover` skill to analyze the image and create object candidates.
4. Ask the user to confirm which object candidates should become generated
   objects unless they explicitly asked for a one-shot run.
5. Create or update one `object.json` per approved object.
6. Generate a clean plate with `image-blast-plate` when object removal is needed.
7. Generate the static world with `image-blast-world`.
8. Generate each object model with `image-blast-3d`.
9. Generate world ambience and object impact sounds with `image-blast-sfx`.
10. Start or refresh the viewer with `bun run dev` and report the route.

Prefer check-ins after analysis and object confirmation. If the user asks for a
full one-shot blast, keep going through the steps above and report the generated
paths at the end.

## Viewer

The viewer is under `app/`. It reads the `worlds/` directory through the custom
Vite plugin in `app/vite.config.ts`. For local development:

```bash
bun run dev
```

For verification:

```bash
bun run typecheck
WORLD_LABS_API_KEY=dummy FAL_KEY=dummy bun run test
bun run build
```

The dummy-key test run only verifies local behavior. Real generation requires
valid provider keys.

## Safety Rules

- Do not commit `.env`, `input/` payloads, generated `worlds/` assets,
  `node_modules/`, or `app/dist/`.
- Do not load large generated images into model context just to inspect them.
  Use paths, JSON metadata, and the viewer instead.
- Do not edit `object.json` with transient generation status. Generated state
  belongs in indexed artifacts and hidden request JSON.
- Use `ls -a` before reading generated output directories so hidden request
  metadata is considered.
- Preserve existing user-generated worlds and do not delete generated assets
  unless the user explicitly asks.

