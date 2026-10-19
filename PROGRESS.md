# Requirement audit — 2026-10-20, fir geometry and horizon pass

The objective in `goal.md` remains active. This pass materially improves the trees, detail transitions and surrounding scenery. **Indistinguishable-from-reality fidelity is not achieved.** Tests and the use of authored assets do not establish that artistic requirement.

## Current state against the original requirements

| Requirement | Evidence | Assessment |
| --- | --- | --- |
| A highly realistic snowy forest that cannot be distinguished from reality | Actual rendered images in `artifacts/reviews/fir-horizon-wide.png` and `fir-refined-branch.png` | More natural tree forms, but the snow is still visibly generated, and close foliage/contact shading need refinement. Incomplete. |
| Fine detail close to trees, snowflakes, bark, ice, rocks, moss, lichen, leaves and debris | Authored fir geometry, 2K materials, prior ground-detail work, current branch/bark review captures | Tree structure improved; overall close-up fidelity remains incomplete. Falling flakes still use flat sprites. |
| Freely explore a 200 m diameter area | `WORLD_RADIUS=100`, radial clamp, movement tests, production entry/movement/pause test | Implemented and verified. |
| Blend the outer boundary into an apparently endless forest | 1,993 trees out to radius 260 m; 640 m snowfield; distance fade at 120–155 m; horizon matched to fog; four elevated edge captures | The visible seam found in the first edge captures was corrected. A player at radius 100 m cannot reach a view of the tree envelope's true edge before its fade completes. Current edge images show continuous mist rather than a cut-off. |
| A virtual red warning near the edge | Radius-88 warning and radius-100 clamp; prior full browser flight | Logic remains unchanged and is covered by current world tests. |
| WASD, Space, Ctrl, Shift, Alt and mouse look | Prior full browser suite; current speed/modifier tests and production movement/pause check | Implemented. No input bindings changed this pass. |

## Changes in this pass

- Replaced separately generated angular tree layouts with derivatives of Poly Haven **Fir Tree 01**, by Rico Cilliers and Rob Tuytel, under CC0. Three authored forms retain textured trunks, branch structure and geometric needles.
- Added a reproducible preparation pipeline. The ignored original source glTF/buffer is downloaded into `.cache/fir`; its buffer is approximately 478 MB. Meshoptimizer is a development-only dependency.
- Derived snow deposits from the full foliage, then reduced the resulting meshes for browser rendering. Whole source needle components are preserved in the nearest foliage model.
- Each detail level reduces the preceding level. A test exposed that the first reducer could choose unused source vertices; compacting between reductions corrected that. Tests now verify that all lower-level vertices belong to their preceding level.
- Complementary coverage fades span 8–11 m and 38–47 m. Near detail uses proximity to the crown as well as horizontal distance, avoiding unnecessary close models far above the trees.
- Trunk clearance uses height-dependent radial envelopes derived from the actual meshes.
- Split the approximately 55 MB runtime geometry package into seven chunks no larger than 8 MiB. The metadata records source provenance and whole-package/per-chunk hashes; chunk URLs include content hashes for cache consistency.
- Added a surrounding ring of trees while retaining all original inner positions, expanded the snowfield, and faded distant geometry into the mist before its real outer extent.
- Elevated renders exposed a mismatch between the visible sky and fog colour. A camera-centred atmosphere now matches the fog at the horizon; the physical Sky remains the environment-light source.
- Canopy snow uses cleaner albedo and reduced ambient intensity. Both help distinguish shaded shapes, but this is not a photorealism completion claim.

## Verification completed

- `npm test`: **16 tests passed**. They cover asset hashes/chunk size, finite geometry/bounds, nested source vertex positions, continuous fade coverage, above-crown distance, world bounds, modifiers, surrounding coverage and prior ground-detail geometry.
- `npm run build`: passed after the final atmosphere change. The Three.js bundle-size advisory remains non-fatal.
- `npm run test:production`: cold loading, both quality settings, actual entry/W movement/Escape pause, warm-cache reload, no missing resources, no runtime/shader errors, and absence of the review API all passed with the new chunked model package. This preceded the surrounding-ring/horizon changes.
- After those final changes, `SMOKE_ONLY=1 node tests/browser.mjs` passed on the production build: 1,993 trees, no missing assets, no shader/runtime errors.
- Review captures at 37, 42.5 and 48 m and at all four elevated playable edges completed without errors. The horizon correction was then re-rendered at all four edges and in the overview.
- Dependency audit reported zero known vulnerabilities after adding the preparation dependency. Runtime rendering does not import Meshoptimizer.

## Durable render evidence

Unlike earlier `/tmp` captures, this pass stores its evidence in the worktree:

- `artifacts/reviews/fir-first-{wide,bark,branch}.png`: first conversion; snow coverage was excessive.
- `artifacts/reviews/fir-refined-{wide,bark,branch}.png`: reduced coverage, whole needle components and cleaner canopy snow.
- `artifacts/reviews/fir-boundaries-lod-{37,42.5,48}.png`: rendered detail-transition viewpoints. Foreground occlusion limits direct silhouette comparison; these are not a motion-video proof.
- `artifacts/reviews/fir-boundaries-edge-{east,north,west,south}.png`: exposed the original fog/sky seam.
- `artifacts/reviews/fir-horizon-edge-{east,north,west,south}.png`: corrected horizon.
- `artifacts/reviews/fir-horizon-wide.png`: latest overview.
- Adjacent JSON files record camera positions, triangle counts and errors.

Reproduce with `npm run review`, using `REVIEW_VIEWS` and `REVIEW_PREFIX` to select cases and output paths. Preparation is `npm run prepare:firs`; runtime meshes are checked in under `public/models/fir`.

## Required work still outstanding

1. Snow mantles still look like generated pillows in close views. Improve their shape, surface shading and contact with foliage using actual render comparisons.
2. Reduced foliage has visible simplification artifacts near branches. Whole nearest needle components help, but retained detail/density and tiny supporting twigs need more work. Consider spatially streaming full close geometry rather than inflating simplified meshes.
3. Detail layouts no longer regenerate, and fades are implemented/tested, but continuous-motion appearance still needs a dedicated visual review. The current transition captures include occluding foreground trees.
4. Moss, lichen, leaves, rocks and icicle attachment/optics remain subject to the prior close-up fidelity audit. Their existence and current geometry tests alone do not prove lifelike appearance.
5. Individual falling snowflakes remain flat six-arm sprites and are not verified at close range.
6. Hardware-accelerated interactive performance is unmeasured. Headless software graphics are extremely slow; successful functional/render checks do not prove smooth user performance.

## Publishing identity

Reuse `.openai/hosting.json` project `appgprj_6ad6027130b88191b7a2473dc43a243a`, owner-private at https://boreal-winter-wilderness.crispbuddy34.chatgpt.site. Do not create another site or change its audience. Source and build archives must be synchronized through the Sites workflow helper. The source head at the start of this pass was `8f4265f4a7e6a8877bb8faecb215bc20f58bd727`.
