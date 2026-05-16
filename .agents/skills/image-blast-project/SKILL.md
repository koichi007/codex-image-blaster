---
name: image-blast-project
description: Create, inspect, and manage an image-blaster project envelope under worlds/<slug>. Use before other image-blast skills or whenever the user asks about project state.
---

# image-blast-project

Use this skill to create or inspect a world project without starting paid
generation.

## Instructions

1. Resolve the project slug. If the user provides an existing `worlds/<slug>`
   directory or slug-like name, use it. Otherwise derive a lowercase hyphenated
   slug from the request.
2. Inspect generated directories with `ls -a` before reading JSON.
3. Create or refresh project state with:

   ```bash
   node .claude/scripts/project/project-state.mjs --world "<slug>" --stage-input
   ```

4. Report the printed state:
   - project slug and display name
   - moved files from `input/`
   - source image count
   - source analysis count
   - whether `image.json` exists
   - object counts
   - whether world output exists
   - whether SFX exists
   - whether `scene.json` exists
5. If source images exist and `image.json` is missing, continue with the
   `image-blast-uncover` skill. If there are no source images, report the
   absolute `input/` path and ask the user to add images.

Do not call provider generation scripts from this skill.

