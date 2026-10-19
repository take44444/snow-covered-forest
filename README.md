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

- 926 deterministic trees in a 350 m diameter surrounding forest, with six variants, tapered trunks, branching timber, needle sprays and separate irregular snow deposits.
- Detailed nearby trees and reduced distant geometry with spatial culling.
- Undulating snow terrain with physically based 2K snow, bark and rock color, normal and roughness textures.
- Snow-covered boulders with textured moss shoots and folded lichen, bowed fallen logs, tapered icicles above the snow, small stems, textured twigs and curled leaves with veins.
- World-space snow and rock texture projection preserves detail across steep and instanced surfaces; photographed foliage is isolated from atlas padding.
- Six-armed drifting snowflakes, 8,100 nearby millimetre-scale 3D ice grains, fine snow surface highlights, atmospheric sky, soft moving sun shadows, blue ambient light and distance haze.
- Optional synthesized ambient wind and movement texture. Audio starts only after interaction.

All runtime material and font assets are served locally. No API keys or runtime network integrations are needed.

## Verify

```sh
npm test
npm run build
npm run test:browser
npm run test:production
# Dedicated close-up review with a camera harness omitted from production:
npm run review
```

The production smoke suite checks both rendering qualities, entry/movement/pause, warm-cache reload and absence of the review camera API. `npm run review` creates seven close-up views and an overview under `/tmp/boreal-review-*.png` and checks plant exposure and icicle clearance. Use `REVIEW_PREFIX` or `REVIEW_VIEWS` to select the output prefix or views.

The browser suite serves the production build automatically and accepts `CHROMIUM_PATH` and `FOREST_URL` environment variables. Install the matching browser with `npx playwright install chromium` if necessary. Browser screenshots are written under `/tmp/boreal-*.png`. The suite checks actual keyboard movement, mouse rotation, ascent/descent, pause/resume, sound, help, boundary warning and the enforced world limit. Read-only scene telemetry is available at `window.__forest.state`.

## Assets

The following scanned materials by **Rob Tuytel / Poly Haven** are licensed **CC0**:

- [Snow 02](https://polyhaven.com/a/snow_02)
- [Bark Brown 02](https://polyhaven.com/a/bark_brown_02)
- [Moss Wood](https://polyhaven.com/a/moss_wood), a cropped green region used for the moss cushion surface
- [Rock Boulder Cracked](https://polyhaven.com/a/rock_boulder_cracked)
- [Pine Tree 01](https://polyhaven.com/a/pine_tree_01), photographed twig color, alpha and normal atlas (Rico Cilliers / Rob Tuytel)

Fonts: DM Sans (Colophon Foundry) and Manrope (Mikhail Sharanda), distributed under the SIL Open Font License. Tree geometry, snowflake map, terrain, debris, atmosphere and audio are generated in source.

This is a real-time procedural scene. Perceived realism depends on graphics hardware, resolution and viewing distance; it is not a scanned reconstruction of a real forest.
