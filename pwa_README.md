# Spanish Tutor PWA

Offline-capable Progressive Web App for Spanish flashcard study.
Works on iPhone, Android, and desktop browsers.

## How it works

- Cards stored locally on each device (IndexedDB)
- Works fully offline after first visit
- Install to home screen: Safari → Share → "Add to Home Screen"

## Hosting (GitHub Pages — free)

1. Create a new repo on GitHub called `spanish-tutor-pwa`
2. Push this folder to it
3. Go to repo Settings → Pages → Source: `main` branch, `/ (root)`
4. Your app will be live at `https://yourusername.github.io/spanish-tutor-pwa`

## Local development

Any static file server works:

```bash
# Python
python -m http.server 8000

# Node
npx serve .
```

Then open `http://localhost:8000`

**Note:** Service worker requires HTTPS or localhost to work.
On GitHub Pages it works automatically.

## CSV Format

```
spanish,english,tags,notes
hola,hello,greeting,
correr,to run,verb|ar,
```

Tags separated by `|` within the tags column.

## File structure

```
index.html
manifest.json
service-worker.js
css/style.css
js/
  db.js          # IndexedDB storage
  fuzzy.js       # Answer grading
  importer.js    # CSV parsing
  flashcard.js   # Study session
  editor.js      # Card management
  app.js         # Navigation
```
