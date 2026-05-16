# Pipeline

Codex Image Blaster is a disk-first image-to-world pipeline. Codex chooses and
runs the steps, but generated assets are created by external providers and saved
under `worlds/<slug>/`.

## Provider Roles

World Labs is the most important provider for the default experience. It creates
the static explorable environment, usually as Gaussian splat `.spz` files plus
preview images and metadata.

FAL is used for optional enhancement steps:

- clean plate and prompt-based image edits
- isolated object reference images
- Hunyuan/Meshy-style image-to-3D model generation
- ambience and object sound effects

Codex is not a 3D generation API. It reads project state, follows repo skills,
runs scripts, checks outputs, and asks the user to confirm expensive steps.

## Directory Flow

```text
input/
  source-image.jpg

worlds/
  <world-slug>/
    project.json
    image.json
    scene.json
    source/
      0-source-image.jpg
      0-source-image.json
      1-source-image-plate.png
      .1-source-image-plate-request.json
    output/
      world/
        0-world.json
        0-world.glb
        0-world-pano.png
        0-world-thumbnail.webp
        0-world-100k.spz
        0-world-150k.spz
        0-world-500k.spz
        0-world-full_res.spz
        .0-world-request.json
      <object-id>/
        object.json
        0-<object-id>.png
        0-<object-id>.glb
        0-<object-id>-obj.obj
        .0-<object-id>__image-request.json
        .0-<object-id>__model-request.json
      sfx/
```

`scene.json` is viewer placement state. It is useful for placing generated GLB
objects, but it is not the generated World Labs space itself.

## Recommended Flow

1. Stage the source image and create or inspect the project.

   ```bash
   node .claude/scripts/project/project-state.mjs --world "<slug>" --stage-input
   ```

2. Analyze the image and create `image.json`.

   Use the `image-blast-uncover` skill. Stop after object candidates are listed.

3. Confirm the object list.

   For most scenes, keep only 1-4 objects for GLB generation. Furniture, lamps,
   plants, and hero props are usually worth generating. Small books, mugs, boxes,
   and wall art are often better left inside the static World Labs scene.

4. Generate the clean plate.

   Use `image-blast-plate` to remove confirmed foreground objects. This prepares
   a better source for the static environment.

5. Generate the World Labs world.

   Use `image-blast-world`. This creates the main 3D room or environment.

6. Inspect the viewer.

   ```bash
   bun run dev
   ```

   Open `http://localhost:5173/<slug>`. Validate the static environment before
   spending on object models.

7. Generate selected object assets.

   Use `image-blast-3d` for only the approved objects. Run sequentially when
   testing new keys or uncertain provider permissions.

8. Place objects.

   Use `/<slug>/edit` in the viewer or ask Codex to create an initial
   `scene.json`. Manual adjustment is still expected for best results.

9. Generate SFX last.

   Use `image-blast-sfx` only after the visual scene is worth keeping.

## Minimal Prompt Set

Analysis:

```text
Use image-blast-project and image-blast-uncover for the image in input/.
Stop after analysis and show me the object candidates before calling providers.
```

World only:

```text
Generate the clean plate and World Labs world. Do not generate object GLBs or
SFX yet.
```

Selective objects:

```text
Generate GLB assets only for these approved objects: <list>. Run provider calls
sequentially and stop if a provider returns authorization, quota, or billing
errors.
```

Viewer:

```text
Start the viewer and give me the local route for this world.
```
