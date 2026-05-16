---
name: image-blast-image-edit
description: Generate one prompt-based image edit from explicit input images.
---

# image-blast-image-edit

Use this skill for source cleanup, object references, clean plates, masks, or
standalone image edits.

## Instructions

1. Require at least one input image and one edit prompt.
2. Inspect the output directory with `ls -a`.
3. Use explicit `--role` and `--output-slug` values when the caller provides
   semantics such as `plate`, `object-mask`, or `image-edit`.
4. Run:

   ```bash
   node .claude/scripts/image-edit/generate-edit.mjs \
     --image "<input image path>" \
     --prompt "<edit prompt>" \
     --output-dir "<output directory>" \
     --role "<role>" \
     --output-slug "<output slug>"
   ```

5. Optional provider override: `--provider nano-banana|gpt-image-2`.
6. Repair missing local image files from request metadata when needed:

   ```bash
   node .claude/scripts/project/ensure-local-assets.mjs --from "<request-json-path>"
   ```

7. Report input images, output image, request metadata, role, and prompt used.

