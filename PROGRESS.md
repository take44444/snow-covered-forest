# Requirement audit — 2026-10-19, close-up review pass

The original objective in `goal.md` remains active. The scene is working and has improved, but indistinguishable-from-reality fidelity is **not achieved**. Do not mark the goal complete based on tests or the existence of detailed assets.

## Original requirements and current evidence

| Requirement | Current evidence | Assessment |
| --- | --- | --- |
| Highly realistic snowy forest, indistinguishable from reality | Rendered overview `/tmp/boreal-cap-final-wide.png` | Still visibly procedural, especially branch silhouettes and snow mantles. Incomplete. |
| Detail when very close to trees, snow, ice, rocks, moss, lichen, leaves and debris | Repeatable camera review in `tests/review.mjs`; photos listed below; current geometry and materials | Several concrete defects fixed; remaining faceting and stylised vegetation prevent a full fidelity claim. |
| 200 m freely explorable area | `WORLD_RADIUS = 100`, position clamp and terrain-clearance tests in `tests/world.test.js` | Verified implementation. |
| Outer environment blends into an apparently endless forest | 926 trees extend to a 175 m radius; terrain spans 460 m; haze blends ground-level views | Not comprehensively verified at every boundary position and altitude. High viewpoints may reveal the scenery's extent. |
| Virtual red warning near the edge | Warning at radius 88 m; previous full keyboard flight reached radius 100 m with warning visible | Verified in the first full browser suite; boundary logic unchanged this pass. |
| WASD, Space, Ctrl, Shift, Alt, mouse look | Previous full browser suite; unchanged movement/input logic; current speed/modifier unit tests; production entry, W movement and Escape pause | Implemented and tested. |

## Changes in this pass

- Added a review-only camera harness, compiled out of production. It renders the actual scene geometry/materials at centimetre distances, rather than substituting isolated preview assets.
- Baseline renders exposed opaque foliage atlas padding, stretched vertical snow textures, buried moss/lichen, primitive leaves and buried icicles.
- Isolated the photographed needle silhouette by connected alpha pixels, excluding opaque UV padding.
- Added world-space triplanar color, normal and roughness sampling for snow and rocks, correctly applying instance transforms. Steep surfaces now retain texture density.
- Replaced moss blobs with irregular textured cushions and millimetre shoots. Added a cropped green region of the CC0 Poly Haven Moss Wood scan and its normal/roughness maps.
- Replaced small lichen blobs with folded lobes, curved leaves with veins, textured small timber, bowed fallen logs and tapered icicles. Exposed plant anchors and icicle tips are checked against the snow height.
- Icicle attachment points follow the timber cross-section; clear refraction is enabled near the logs. Their visible connection and optical appearance still merit refinement.
- Reduced the oversized frost geometry to small hexagonal grains.
- Made boulder snow edges irregular after the overview exposed an overly level cap boundary.
- Queued all texture loads before the first asynchronous yield, preventing a cached-load race when building the needle cutout.

## Verification actually completed

- `npm test`: **10 tests passed**, covering world bounds, modifiers, terrain, deterministic forest coverage, thin curved leaf geometry, consistent moss cushion detail levels, lichen folds, outward icicle normals and rock normals.
- `npm run build`: production build passed. The Three.js bundle size advisory is non-fatal.
- `npm run test:production`: cold load, both detail qualities, actual entry/W movement/Escape pause, warm-cache reload, no missing resources, no shader/runtime errors, and absence of `window.__forestReview` in production all passed. This ran before the final geometry-only snow-cap edge adjustment; shaders, loading and input code were unchanged afterward.
- Review-mode captures passed with no shader/runtime errors. Plant anchors and icicle tips clear the snow surface. The final cap edge adjustment was rendered in both rock and wide views.
- No additional dependencies were added.

## Render evidence

- Original close-up images are preserved under `/tmp/boreal-baseline/`.
- Final bark, moss, lichen, icicle and snow views: `/tmp/boreal-close-final-{bark,moss,lichen,icicle,snow}.png`.
- Leaf and rock views from the intermediate full review: `/tmp/boreal-final-review/boreal-close-before-{leaf,rock}.png`.
- Final rock and overview after irregular cap edges: `/tmp/boreal-cap-final-{rock,wide}.png`.
- Production overview with UI, before that last cap adjustment: `/tmp/boreal-production-updated.png`.
- Adjacent JSON files record camera positions and render errors. These `/tmp` QA artifacts are not deployed source assets.
- Reproduce with `npm run review`; `REVIEW_PREFIX` chooses a file prefix and `REVIEW_VIEWS` filters comma-separated views. The default produces `/tmp/boreal-review-*.png`.

## Outstanding work toward the full objective

1. Tree branches, trunk silhouettes and snow mantles remain visibly faceted in close views. Needle scale and repeated crown forms still need attention.
2. High/low tree models consume different random sequences, so their shapes can change at the detail transition. Preserve one underlying branching structure across levels, then verify moving views.
3. Moss and lichen have more detail but still look like generated clumps at very close range. Improve their surface conformity, shape variation and contact shading from rendered evidence.
4. Individual falling snowflakes use flat six-arm sprites. Their close-up appearance has not been proved realistic.
5. Verify the endless-forest illusion from multiple edge locations and high viewpoints; extend distant scenery if those views expose its boundary.
6. Interactive performance on hardware-accelerated desktop graphics remains unmeasured. Headless software graphics verify function and rendering correctness, not smooth user performance.

## Project identity and publishing

Reuse `.openai/hosting.json` project ID `appgprj_6ad6027130b88191b7a2473dc43a243a`. The site is owner-private at https://boreal-winter-wilderness.crispbuddy34.chatgpt.site. Do not create another site or change its audience.

Use the Sites source workflow helper for source push and matching archive packaging. The previous live source commit was `894ed56124b9686b4437fa2955a2d9e1ac3e40a1`. Publishing this pass will create a later version of the same project. Credentials are short-lived and must remain in session memory, passed only through helper stdin.
