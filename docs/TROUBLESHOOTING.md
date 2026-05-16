# Troubleshooting

## FAL Returns 403

`FAL submit failed (403)` usually means the key is valid enough to reach FAL but
does not have access to that model endpoint, has a billing/quota issue, or is
using a provider route that is unavailable for the account.

What to try:

1. Confirm `.env` contains `FAL_KEY`.
2. Restart the terminal or rerun the command so the environment is reloaded.
3. Try a different image-edit provider if the skill supports it, for example
   `gpt-image-2` instead of the default image-edit provider.
4. Run object generation sequentially instead of in parallel.
5. Stop if repeated 403s happen. Do not keep retrying provider calls blindly.

## World Labs Succeeds But Objects Are Missing

This can be normal. World Labs creates the static environment. Object GLBs are a
separate optional step under `worlds/<slug>/output/<object-id>/`.

Check project state:

```bash
node .claude/scripts/project/project-state.mjs --world "<slug>"
```

If `world output` is present but objects are pending, the world exists and object
generation simply has not been completed.

## High Quality Mode Is Slow

The viewer renders Gaussian splats, shadows, post-processing, and optional
depth-of-field. High quality can be heavy on laptop GPUs.

Use Low quality for navigation and editing. Use High only when checking the final
look. If performance is still poor, close other GPU-heavy apps and restart the
dev server.

The current adapter still follows the original viewer behavior closely. A future
improvement should map quality levels to splat LOD files, such as `100k`,
`150k`, `500k`, and `full_res`, instead of treating quality as only a render
effects toggle.

## The Room Looks Blurry Or Too Close

First check whether you are in edit mode. `/<slug>/edit` is for placement, not
normal navigation. Open:

```text
http://localhost:5173/<slug>
```

Then click the viewer reset button in the upper-left controls and switch the
controller to `Fly`.

If the browser persisted bad viewer state, clear it from the browser console:

```js
localStorage.removeItem('image-blaster-debug')
location.reload()
```

## Scene Placement Looks Wrong

`scene.json` controls object placement and some viewer overrides. It is not the
World Labs-generated room itself.

To temporarily disable placement overrides:

```bash
mv worlds/<slug>/scene.json worlds/<slug>/scene.backup.json
```

Refresh the viewer after moving the file.

## Camera Controls

Recommended mode:

- Use `Fly` mode for inspecting the generated world.
- Use `FPS` mode only when you want physics-style walking.

Controls:

- right mouse drag: look around
- trackpad two-finger drag: look around
- `W/A/S/D`: move
- `Q/E`: move down/up
- reset button: reset camera and objects

## Shell Shows `cmdand quote>` Or `dquote>`

The shell is waiting for a closing quote. Press `Ctrl+C` to cancel the broken
command, then paste the command again as one clean line.

For checking keys without printing secrets:

```bash
node -e "import('./.claude/scripts/asset-pipeline/fal-queue.mjs').then(async m => { await m.loadDotEnv(); console.log('WORLD_LABS_API_KEY', Boolean(process.env.WORLD_LABS_API_KEY)); console.log('FAL_KEY', Boolean(process.env.FAL_KEY)); })"
```

## Do Not Commit Generated Assets

Generated images, worlds, models, SFX, `.env`, `node_modules/`, and `app/dist/`
should stay out of git unless you intentionally create a small fixture for a
test. Keep provider outputs local by default.
