# Boreal — A winter wilderness

A first-person WebGL 2 forest in a **200 m diameter** circular exploration area. The forest and snowfield continue beyond the playable boundary into atmospheric haze. A red warning appears within 12 m of the edge; movement is clamped at a 100 m radius. Development requires Node.js 20.19+ or 22.12+.

## Run

```sh
npm install
npm run dev
```

Open the URL printed by Vite and select **Enter the forest**. A current desktop browser with WebGL 2 and hardware acceleration is recommended. The Balanced option reduces pixel density and disables dynamic shadows. Mouse capture requires a user click; if unavailable, drag to look. Touch controls are included for coarse pointers.

## Controls

| Input | Action |
| --- | --- |
| W / A / S / D | Move forward / left / back / right |
| Mouse | Look around |
| Space | Ascend |
| Ctrl | Descend |
| Shift | Fast movement, 14 m/s |
| Alt | Slow movement, 0.8 m/s |
| Esc | Release mouse and pause |
| H | Control reference |
| M | Toggle ambient wind |

Normal movement is 4 m/s. Vertical controls allow free flight; the camera cannot pass below the snow surface or through tree trunks. Alt takes precedence when both speed modifiers are held. Browser and operating-system shortcuts may intercept a modifier; focus the scene first.

## Scene

- 1,993 deterministic trees in a 520 m diameter surrounding forest, using three authored fir forms with detailed textured trunks, geometric needles and foliage-derived snow deposits.
- Three detail levels reduced successively from the same source meshes, spatial culling, and complementary coverage fades at 8–11 m and 38–47 m. Trunk clearance follows per-height envelopes derived from the meshes.
- Undulating snow terrain with physically based 2K snow, bark and rock color, normal and roughness textures. Canopy snow uses cleaner albedo, a physical surface normal map and baked ambient occlusion in sheltered creases.
- Snow-covered boulders with textured moss shoots and folded lichen, bowed fallen logs, tapered icicles above the snow, small stems, textured twigs and curled leaves with veins.
- World-space snow and rock texture projection preserves detail across steep and instanced surfaces; fir needle geometry retains its source UV coordinates.
- 900 tumbling, sixfold 3D dendrites (about 6 mm across), subpixel distant snowfall, 8,100 nearby millimetre-scale 3D ice grains, fine snow surface highlights, atmospheric sky, soft moving sun shadows, blue ambient light and distance haze.
- Optional synthesized ambient wind and movement texture. Audio starts only after interaction.

All runtime material and font assets are served locally. No API keys or runtime network integrations are needed.

## Verify

```sh
npm test
npm run build
npm run test:browser
npm run test:production
npm run test:snowfall
# Dedicated close-up review with a camera harness omitted from production:
npm run review
```

The isolated snowfall render check measures visible pixels from a live crystal at centimetre range. The full-scene crystal review also compares the framebuffer with snowfall visible and hidden.

The production smoke suite checks both rendering qualities, entry/movement/pause, warm-cache reload and absence of the review camera API. `npm run review` creates close-up, detail-transition, elevated edge and overview views under `/tmp/boreal-review-*.png` and checks plant exposure and icicle clearance. Use `REVIEW_PREFIX` or `REVIEW_VIEWS` to select the output prefix or views.

The browser suite serves the production build automatically and accepts `CHROMIUM_PATH` and `FOREST_URL` environment variables. Install the matching browser with `npx playwright install chromium` if necessary. Browser screenshots are written under `/tmp/boreal-*.png`. The suite checks actual keyboard movement, mouse rotation, ascent/descent, pause/resume, sound, help, boundary warning and the enforced world limit. Read-only scene telemetry is available at `window.__forest.state`.

## Assets

Materials and tree assets from **Poly Haven** are licensed **CC0** (see the linked asset pages for author credits):

- [Snow 02](https://polyhaven.com/a/snow_02)
- [Bark Brown 02](https://polyhaven.com/a/bark_brown_02)
- [Moss Wood](https://polyhaven.com/a/moss_wood), a cropped green region used for the moss cushion surface
- [Rock Boulder Cracked](https://polyhaven.com/a/rock_boulder_cracked)
- [Fir Tree 01](https://polyhaven.com/a/fir_tree_01), source tree geometry and fir needle textures, by Rico Cilliers / Rob Tuytel
- [Pine Tree 01](https://polyhaven.com/a/pine_tree_01), retained legacy twig atlas (Rico Cilliers / Rob Tuytel; no longer loaded by the fir renderer)

Fonts: DM Sans (Colophon Foundry) and Manrope (Mikhail Sharanda), distributed under the SIL Open Font License. Fir geometry is derived from the credited model. Snow deposits, terrain, debris, atmosphere, snowflake geometry and audio are generated in source.

This is a real-time procedural scene. Perceived realism depends on graphics hardware, resolution and viewing distance; it is not a scanned reconstruction of a real forest.

The playable diameter remains 200 m. Surrounding trees extend to a 260 m radius, fade into mist between 120–155 m from the camera, and sit on a 640 m snowfield. The visible horizon matches the fog colour to conceal the scenery edge from elevated views.

## Rebuilding fir assets

`npm run prepare:firs` downloads the CC0 source glTF/buffer into ignored `.cache/fir` and prepares the checked-in browser meshes. The original source buffer is approximately 478 MB. Meshoptimizer is a preparation-only dependency; no geometry simplification runs in the browser.

The preparation script keeps complete source needle components in the nearest model, reduces lower levels successively, derives supported snow caps on a 256-cell grid from the full foliage, screens out layers sheltered by foliage immediately above, welds their surfaces before recomputing world-space normals, bakes local ambient visibility into the snow UV data, and stores provenance/integrity metadata. The binary package is split into chunks of at most 8 MiB and loaded from the same origin. `tests/fir-assets.test.js` checks integrity, bounds, nested source positions, and fade coverage.

Visual review captures are stored in `artifacts/reviews`. The latest comparison and remaining visual gaps are described in `artifacts/reviews/canopy-assessment.md`. Snow forms and close foliage still fall short of the original photorealism goal, which remains active.
