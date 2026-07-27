# Where to put your exported PNGs

Create one folder per case, named after the `id` you used in `config.js`
(defaults to `2`..`9`, matching `IMAGES` in that file).

Inside each folder, place these files (the app tries `.jpg`, `.jpeg`,
then `.png`, so any of the three extensions works — just match the base
name exactly):

```
images/
  2/
    original.png          <- the raw ultrasound image
    majority_vote.png     <- expert majority-vote overlay
    staple.png             <- STAPLE overlay
    yiffana_pt.png         <- Percentile Threshold (Yiffana)
    yiffana_blanket.png    <- Percentile Threshold + Blanket
    pipeline_v10_61.png
    pipeline_v10_62.png
    pipeline_v10_63.png
    pipeline_v10_70.png
    pipeline_v10_90.png
  3/
    original.png
    ... (same 9 files)
  ...
  9/
    ...
```

The 7 algorithm filenames must match the `id` field of each entry in
`ALGORITHMS` inside `config.js`. If you rename or reorder algorithms
there, rename the files here to match.

Tip: these are exactly the per-panel overlay images your
`comparison_grid.py` script already generates internally (via
`make_overlay()`) — you can adapt that script to save each panel as its
own file instead of (or in addition to) the combined grid, using this
same folder/filename convention.
