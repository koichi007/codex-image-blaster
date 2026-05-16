---
name: image-blast-uncover
description: Analyze source images, write image.json, present object candidates, and create object.json files after user confirmation.
---

# image-blast-uncover

Use this skill for the no-cost image understanding and object-candidate phase.

## Instructions

1. Require a world slug. If missing, ask which `worlds/<slug>/` to use.
2. Ensure stable project state:

   ```bash
   node .claude/scripts/project/project-state.mjs --world "<slug>" --stage-input
   ```

3. Follow the legacy JSON contract in
   `.claude/skills/image-blast-uncover/IMAGE-BLAST.md`.
4. Analyze the latest visible source image in each indexed source family under
   `worlds/<slug>/source/`.
5. Write one sibling JSON file per analyzed source image:

   ```text
   worlds/<slug>/source/<image-name>.json
   ```

6. Merge valid source analyses into:

   ```text
   worlds/<slug>/image.json
   ```

7. Use literal, technical language. Extract only cleanly segmentable physical
   objects. Do not extract walls, floors, sky, terrain, fog, or fixed
   architectural surfaces as standalone objects.
8. Present the scene summary and object candidates to the user for approval.
9. After approval, create or update one durable intent file per object:

   ```text
   worlds/<slug>/output/<object-slug>/object.json
   ```

10. `object.json` stores stable identity and provenance only. Do not write
    generated status, jobs, request lifecycle, or output file lists there.
11. Ask whether to create a clean plate unless the user asked for a one-shot
    blast.
12. Refresh state with:

    ```bash
    node .claude/scripts/project/project-state.mjs --world "<slug>"
    ```

