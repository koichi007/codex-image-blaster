---
name: image-blast-3d
description: Generate one atomic 3D object from an approved object.json or direct source image.
---

# image-blast-3d

Use this skill to generate exactly one object model.

## Instructions

1. Require a world slug and one clear object id/name. If ambiguous, ask for one
   atomic physical object.
2. Inspect `worlds/<slug>/output/<object>/` with `ls -a`.
3. Resolve the object from `object.json`, `image.json`, or source analysis JSON.
4. If no `object.json` exists and the object is clear, create the minimal
   durable object intent before generation.
5. Build an object-specific extraction prompt that isolates one physical object:

   ```text
   Isolate the <target object> from this image. Reproduce it exactly as shown -- same colors, materials, and proportions. White background, centered, tight crop, studio lighting. No other objects, no scene, no people, no text, no shadows on the ground. Isolate the object and remove all clustered, adjacent, overlapping, or items resting on the target object. Create a clean render of that one single object that is true to the source image.
   ```

6. Generate with:

   ```bash
   node .claude/scripts/asset-pipeline/generate-single-asset.mjs --world "<slug>" --object-id "<object-id>" --image-edit-prompt "<object-specific extraction prompt>"
   ```

7. Hunyuan is the default provider. Use `--provider meshy` only when requested.
   Pass Hunyuan or Meshy parameters only when the user asks for them.
8. Use `--reference-only` for extraction-only runs, `--regenerate` for a new
   model from an existing reference, and `--regenerate-reference` for a new
   extraction plus model.
9. Repair missing local files from request metadata when needed:

   ```bash
   node .claude/scripts/project/ensure-local-assets.mjs --from "<request-json-path>"
   ```

10. Report object id, output directory, reference image, generated model files,
    and request metadata.

