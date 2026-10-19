# Requirement audit — 2026-10-19

The original objective in `goal.md` remains active. This is a working first version, not a claim that indistinguishable-from-reality fidelity has been achieved.

## Verified implementation

- 200 m playable diameter: `WORLD_RADIUS = 100`, radial position clamp, terrain clearance and a 65 m flight ceiling.
- Seamless surrounding forest: 926 trees extend to a 175 m radius; terrain extends 230 m from the centre along each axis. Atmosphere hides the outer scenery.
- Virtual red boundary warning: visible from an 88 m radius. The real browser keyboard flight reached the edge and remained at radius 100 m. Last measured position: `[51.30351119538674, 28.37168536535305, 85.83676216531485]`.
- Browser-tested WASD movement, Space ascent, Ctrl descent, mouse look, Escape pause, resume, help and sound toggles.
- Both Shift keys select 14 m/s; both Alt keys select 0.8 m/s; default 4 m/s. Modifier mapping is covered by unit tests.
- Detailed assets in source: bark, snow and rock PBR textures; photographed needle atlas; individually branched tree geometry and separate snow mantle; boulders, moss, lichen, logs, icicles, dead leaves, twigs, stems, six-armed snowflakes and 8,100 nearby hexagonal ice grains.
- All textures and fonts are local, with asset credits and font licences.

## Checks actually completed

- `npm test`: 5 tests passed.
- `npm run build`: production build passed. Three.js emits a non-fatal bundle size advisory.
- `npm audit`: zero known dependency vulnerabilities.
- `node tests/browser.mjs`: full production-browser exploration suite passed, including the red warning and radial stop. The test uses a self-hosted static production build and low pixel density for software-rendered CI.
- After the final static-shadow optimisation: `SMOKE_ONLY=1 FOREST_DPR=1 node tests/browser.mjs` passed at 960 × 640. No JavaScript/render errors and no missing texture assets.
- Wide screenshot: `/tmp/boreal-overview.png`. Boundary screenshot: `/tmp/boreal-boundary.png`. These are local QA files, not source assets.

## Outstanding fidelity audit

- The wide view remains recognisably procedural. The requirement that the world cannot be distinguished from reality is **not yet proved**.
- Very close tree, bark, moss, lichen, debris, icicle and snow-grain views still need dedicated rendered review. Existence of geometry and textures alone does not prove this requirement.
- The high/low tree model transition needs visual review during travel; the two procedural variants currently consume different random sequences, which may cause visible shape changes.
- Performance on a hardware-accelerated desktop GPU has not been measured. The provided headless environment uses slow software graphics; functional tests pass but this is not evidence of smooth interactive performance on user hardware.
- Consider improving trunk silhouettes, irregular foliage growth and snow-mantle forms after the close-view review, using the visual evidence to choose the next change.

## Project identity

`.openai/hosting.json` contains the authoritative Sites project ID. Reuse it; do not create another site. Source is a self-contained Vite + Three.js project rooted in this directory. The Sites workflow helper initialized the local Git repository. Publishing must use the pushed source commit and matching build archive.
