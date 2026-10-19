# Canopy support and ambient occlusion review

The preparation step now rejects isolated vertical supports and foliage beneath another layer within 36 cm. Deposits have a shallow base and a deeper rounded top. The source field uses 256 cells per axis. These are accumulation heuristics; they do not constitute a physical snow simulation.

Ambient visibility is traced against the prepared snow field, smoothed across connected surface vertices, and stored in the otherwise unused snow UV coordinate. The material applies it to indirect lighting at 65% strength. No ambient-occlusion tracing runs in the browser. The runtime model package is 62,125,092 bytes, approximately 4.8 MB larger than the preceding version.

`snow-overhead-branch-reference.png` and `canopy-final-branch-reference.png` compare the same geometry and camera before and after ambient occlusion. `canopy-final-wide.png` shows the final landscape. The final shader review reports no console or page errors. An elevated edge view before the occlusion softening also retained the fog-hidden horizon.

The creases now have more depth, and gaps between deposits expose more stems. The forms remain too rounded, foliage is sparse, and the overall image is visibly rendered. The original photorealism goal is not achieved. Hardware frame rate remains unmeasured; browser QA uses software graphics. The final wide capture renders approximately 7.8 million triangles.

24 unit tests pass, including support, overhead screening, ambient visibility, connected-surface smoothing, finite/bounded mesh data and preservation across detail levels. The production browser check covers cold/warm loading, both quality settings and entry/movement/pause. That check began before the final occlusion softening; the final shader and baked values were verified in the dedicated rendering review.

The next substantial fidelity improvement should preserve dense source needles in the immediate neighbourhood of the camera. The current nearest model keeps only 40,000 whole needle components per form; the largest source has 804,651. The inspected four-triangle components use six vertices in a bent blade. The complete CC0 source remains in ignored `.cache/fir`; spatial patches could retain its positions, normals and UVs without drawing the full foliage throughout the forest. Forest density, close ground objects and snow shape also require further review.
