---
name: image-blast-plate
description: Generate one clean plate image for a world by removing confirmed foreground objects or user-specified content.
---

# image-blast-plate

Use this skill after object confirmation when the world source should be cleaned
before static environment generation.

## Instructions

1. Require a world slug.
2. Inspect `worlds/<slug>/source/` and `worlds/<slug>/output/` with `ls -a`.
3. Select the source image from the user request or the newest visible source
   image in `worlds/<slug>/source/`.
4. Build one removal-only prompt from confirmed object names and any extra user
   removal instructions.
5. Generate the plate in the source directory:

   ```bash
   node .claude/scripts/image-edit/generate-edit.mjs \
     --image "<selected source image path>" \
     --prompt "remove the following from the image: <confirmed object names and user removals>" \
     --output-dir "worlds/<slug>/source" \
     --role plate \
     --output-slug "<source-slug>-plate"
   ```

6. The output must use the next visible source index, such as
   `1-room-plate.png`, not `0-room-plate.png`.
7. Optional provider override: `--provider nano-banana|gpt-image-2`.
8. Repair missing local image files from request metadata when needed:

   ```bash
   node .claude/scripts/project/ensure-local-assets.mjs --from "<request-json-path>"
   ```

9. Report input image, output plate image, request metadata, and prompt used.

