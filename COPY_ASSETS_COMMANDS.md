# Commands to Copy All Assets to PythonAnywhere

Run these commands on PythonAnywhere to copy all images and assets from the `frontend/public` folder (which are in `frontend/build` after building).

## Quick Copy-Paste (All Commands)

```bash
cd ~/Dorsu-Alumni-Tracer && \
git pull origin main && \
mkdir -p backend/staticfiles backend/templates && \
cp frontend/build/*.jpg backend/staticfiles/ 2>/dev/null; \
cp frontend/build/*.jpeg backend/staticfiles/ 2>/dev/null; \
cp frontend/build/*.png backend/staticfiles/ 2>/dev/null; \
cp frontend/build/*.gif backend/staticfiles/ 2>/dev/null; \
cp frontend/build/*.svg backend/staticfiles/ 2>/dev/null; \
cp frontend/build/*.ico backend/staticfiles/ 2>/dev/null; \
cp frontend/build/*.webp backend/staticfiles/ 2>/dev/null; \
cp frontend/build/*.mp4 backend/staticfiles/ 2>/dev/null; \
cp frontend/build/*.webm backend/staticfiles/ 2>/dev/null; \
cp frontend/build/robots.txt backend/staticfiles/ 2>/dev/null; \
cp frontend/build/manifest.json backend/staticfiles/ 2>/dev/null; \
cp frontend/build/index.html backend/templates/ && \
cd backend && \
source venv/bin/activate && \
python manage.py collectstatic --noinput
```

## Step-by-Step Commands

### Step 1: Pull Latest Changes
```bash
cd ~/Dorsu-Alumni-Tracer
git pull origin main
```

### Step 2: Create Directories
```bash
mkdir -p backend/staticfiles
mkdir -p backend/templates
```

### Step 3: Copy All Image Files
```bash
cp frontend/build/*.jpg backend/staticfiles/
cp frontend/build/*.jpeg backend/staticfiles/
cp frontend/build/*.png backend/staticfiles/
cp frontend/build/*.gif backend/staticfiles/
cp frontend/build/*.svg backend/staticfiles/
cp frontend/build/*.ico backend/staticfiles/
cp frontend/build/*.webp backend/staticfiles/
```

### Step 4: Copy Video Files
```bash
cp frontend/build/*.mp4 backend/staticfiles/
cp frontend/build/*.webm backend/staticfiles/
```

### Step 5: Copy Other Files
```bash
cp frontend/build/robots.txt backend/staticfiles/
cp frontend/build/manifest.json backend/staticfiles/
cp frontend/build/favicon.ico backend/staticfiles/
```

### Step 6: Copy index.html to Templates
```bash
cp frontend/build/index.html backend/templates/
```

### Step 7: Collect Static Files
```bash
cd backend
source venv/bin/activate
python manage.py collectstatic --noinput
```

### Step 8: Reload Web App
1. Go to **Web** tab on PythonAnywhere
2. Click the green **"Reload"** button
3. Wait a few seconds

## Verify Assets Were Copied

```bash
cd ~/Dorsu-Alumni-Tracer
ls -la backend/staticfiles/*.jpg | head -10
ls -la backend/staticfiles/*.png | head -10
ls -la backend/staticfiles/*.mp4
ls -la backend/templates/index.html
```

You should see files like:
- `logo_hanap.jpg`
- `picture_1.jpg`, `picture_2.jpg`, `picture_3.jpg`
- `1ni.jpg`, `2ni.jpg`, `3ni.jpg`
- `dorsu_logo.jpg`, `dorsu_logo.png`
- `Dorsu-Hymn.mp4`, `DORSU-Promotional-Video.mp4`
- And all other images from the `public/` folder

## Test Your Site

Visit: `https://mikemisoles74.pythonanywhere.com`

All images should now be accessible at root paths like:
- `/logo_hanap.jpg`
- `/picture_1.jpg`
- `/dorsu_logo.jpg`
- `/Dorsu-Hymn.mp4`
- etc.

