---
name: image-blast-wildcard
description: Discover and run arbitrary FAL operations that do not fit the narrower image-blast skills.
---

# image-blast-wildcard

Use this skill as an escape hatch for FAL models outside the standard world,
image-edit, 3D, and SFX flows.

## Instructions

1. In discovery mode, do not run paid FAL requests until the user confirms one
   exact endpoint.
2. Discover candidates through the FAL Platform Model Search API:

   ```text
   https://api.fal.ai/v1/models?q=<query>&status=active&limit=5
   https://api.fal.ai/v1/models?category=<category>&status=active&limit=5
   https://api.fal.ai/v1/models?endpoint_id=<endpoint>&expand=openapi-3.0
   ```

3. Present endpoint candidates and ask the user to confirm one exact endpoint.
4. In execution mode, after confirmation, build schema-shaped JSON inputs from
   the user's literal request.
5. For local files, pass them with `--file <schema_key>=<path>` so the helper
   converts them to model input URLs.
6. Run:

   ```bash
   node .claude/scripts/fal/run-fal.mjs \
     --endpoint "<fal endpoint>" \
     --input-json '<schema-shaped JSON input>' \
     --output-dir "<output directory>" \
     --output-slug "<short output slug>" \
     --user-prompt "<literal user request>"
   ```

7. Add `--mode run` only when the FAL API page requires direct `fal.run`
   behavior instead of the queue API.
8. Repair missing local files from request metadata when needed:

   ```bash
   node .claude/scripts/project/ensure-local-assets.mjs --from "<request-json-path>"
   ```

9. Report endpoint, input summary, output directory, downloaded files, request
   metadata, and any raw result fields that were not downloadable.

