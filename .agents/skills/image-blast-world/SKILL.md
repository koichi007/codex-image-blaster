---
name: image-blast-world
description: Generate or resume the static 3D environment for a world using World Labs Marble.
---

# image-blast-world

Use this skill to create the static environment asset set for one world.

## Instructions

1. Require a world slug.
2. Inspect `worlds/<slug>/output/world/` with `ls -a`.
3. Read `worlds/<slug>/image.json` and confirmed
   `worlds/<slug>/output/<object>/object.json` files when present.
4. Synthesize an empty-environment prompt: preserve setting, materials, lighting,
   camera feel, and spatial layout, while subtracting confirmed objects and
   explicitly removed items.
5. Generate or resume with:

   ```bash
   node .claude/scripts/world/generate-world.mjs --world "<slug>" --prompt "<empty-environment world caption>"
   ```

   Add `--image "<path>"` only when using a specific source image other than the
   helper default. Add `--regenerate` only when the user requested a new version.
6. The script writes `N-world.json`, downloads World Labs assets, and records
   `.N-world-request.json`.
7. If metadata references provider URLs but local files are missing, repair:

   ```bash
   node .claude/scripts/project/ensure-local-assets.mjs --from "worlds/<slug>/output/world/<N>-world.json"
   ```

8. Report the generation index, `world_json`, `.glb`, `.spz`, panorama,
   thumbnail, and request metadata paths.

