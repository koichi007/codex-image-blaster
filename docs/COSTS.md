# Costs

Provider calls can cost money. Codex Image Blaster is designed to let Codex
orchestrate the workflow, but the expensive work is still performed by World
Labs, FAL, Hunyuan/Meshy-style model providers, and audio providers.

## Cost Centers

World Labs:

- Generates the static 3D environment.
- Usually gives the biggest visual payoff.
- Should normally be run before object generation.

FAL image edit:

- Generates clean plates.
- Generates isolated object reference images.
- May fail with authorization errors if the account does not have access to a
  specific model endpoint.

FAL image-to-3D:

- Generates GLB/OBJ assets from isolated object images.
- Can become expensive if every detected object is approved.
- Should be used for selected interactive or replaceable objects.

FAL SFX:

- Generates ambient loops and object sounds.
- Should be run after the scene is visually useful.

## Recommended Budget Discipline

Use this default order:

1. Analyze the image.
2. Generate the clean plate.
3. Generate the World Labs world.
4. Inspect the viewer.
5. Choose 1-4 objects for GLB generation.
6. Generate SFX last.

Avoid this order:

```text
analyze -> approve all objects -> generate every GLB -> generate SFX -> inspect
```

That flow spends money before proving the world is worth keeping.

## Object Selection

Good first objects:

- a desk or table
- a chair
- a lamp
- a plant
- a large hero prop

Usually skip on the first pass:

- individual books
- small cups or mugs
- wall prints
- storage boxes
- tiny decor
- anything mostly hidden by the World Labs static scene

If an object does not need to move, collide, be clicked, or be replaced, it often
does not need a separate GLB.

## Prompt Guardrail

Before any provider-heavy run, ask Codex to estimate the work:

```text
Before calling providers, list the provider calls you are about to make, the
objects involved, and the stop conditions. Wait for my approval.
```

For an inexpensive first run:

```text
Run only the World Labs world generation after the clean plate. Do not generate
object GLBs or SFX.
```

For object generation:

```text
Generate at most 3 object GLBs, sequentially. Stop after each completed object
and summarize the files created.
```
