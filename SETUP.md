# Setup guide

Three things need to happen, in this order: (1) backend, (2) images +
config, (3) hosting. Everything is free.

## 1. Backend — Google Sheet + Apps Script

1. Create a new Google Sheet (sheets.new). Name it something like
   "Bone & Callus Survey — Responses".
2. In the Sheet, go to **Extensions → Apps Script**.
3. Delete the placeholder code and paste in the full contents of
   `apps-script/Code.gs` from this project.
4. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, authorize the permissions Google asks for (it's
   your own script, on your own Sheet — safe to approve).
6. Copy the **Web app URL** it gives you (ends in `/exec`).
7. Open `config.js` in this project and paste that URL into
   `APPS_SCRIPT_URL`.

To test it worked: paste the Web App URL into a browser tab. You should
see `{"ok":true,"msg":"Bone & Callus survey endpoint is live."}`.

Responses will show up as new rows in the "Responses" tab of your Sheet
as experts submit — no further setup needed.

## 2. Images + config

1. Follow `images/README.md` to place your exported PNGs in the right
   folders.
2. Open `config.js` and check:
   - `IMAGES` lists the right case IDs, in the order you want them shown.
   - `ALGORITHMS` lists your 7 methods (the `id` must match the image
     filenames; `label` is just for your own reference in the code —
     experts never see it, they only see "Option A".."Option G").
   - `VIDEO_TUTORIAL_URL` points to your tutorial video.

## 3. Hosting — GitHub Pages

1. Create a new **public** GitHub repository (private repos need a paid
   plan for Pages).
2. Upload all the files in this project (`index.html`, `styles.css`,
   `app.js`, `config.js`, and the whole `images/` folder) to the repo —
   keep them at the root, not inside a subfolder.
3. Go to the repo's **Settings → Pages**.
4. Under "Source", choose **Deploy from a branch**, branch `main`,
   folder `/ (root)`. Save.
5. GitHub gives you a URL like
   `https://yourusername.github.io/your-repo-name/` within a minute or
   two — that's the link to send your experts.

(Netlify or Vercel work too, if you'd rather drag-and-drop the folder
instead of using git — both have a free tier and don't need the Apps
Script step changed at all.)

## Before sending it out

- Open the live link yourself, fill it out once end-to-end, and check
  the row appears in your Google Sheet.
- Test on a phone — the layout is responsive, but a real test beats
  assuming.
- Note for the panel: progress is **not** saved if they close the tab
  partway through (no browser storage is used, by design, so nothing
  about their session lingers on a shared/borrowed computer). Mention
  in your tutorial video that they should set aside ~10 uninterrupted
  minutes.

## Customizing further

- Colors/fonts: `styles.css`, top of the file (`:root` block).
- Wording on the welcome/thank-you screens: `app.js`, functions
  `renderWelcome` and `renderThanks`.
- Number of cases or algorithms: just edit `config.js` — everything
  else (progress bar, review screen, spreadsheet columns) adapts
  automatically.
