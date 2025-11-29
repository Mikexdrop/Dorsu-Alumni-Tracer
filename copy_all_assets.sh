#!/bin/bash
# Script to copy all assets from frontend/build to backend/staticfiles
# Run this on PythonAnywhere after building the React app

cd ~/Dorsu-Alumni-Tracer

# Create staticfiles directory if it doesn't exist
mkdir -p backend/staticfiles

# Copy all image files
echo "Copying image files..."
cp frontend/build/*.jpg backend/staticfiles/ 2>/dev/null || true
cp frontend/build/*.jpeg backend/staticfiles/ 2>/dev/null || true
cp frontend/build/*.png backend/staticfiles/ 2>/dev/null || true
cp frontend/build/*.gif backend/staticfiles/ 2>/dev/null || true
cp frontend/build/*.svg backend/staticfiles/ 2>/dev/null || true
cp frontend/build/*.ico backend/staticfiles/ 2>/dev/null || true
cp frontend/build/*.webp backend/staticfiles/ 2>/dev/null || true

# Copy video files
echo "Copying video files..."
cp frontend/build/*.mp4 backend/staticfiles/ 2>/dev/null || true
cp frontend/build/*.webm backend/staticfiles/ 2>/dev/null || true

# Copy other important files
echo "Copying other files..."
cp frontend/build/robots.txt backend/staticfiles/ 2>/dev/null || true
cp frontend/build/manifest.json backend/staticfiles/ 2>/dev/null || true
cp frontend/build/favicon.ico backend/staticfiles/ 2>/dev/null || true

# Copy index.html to templates directory
echo "Copying index.html to templates..."
mkdir -p backend/templates
cp frontend/build/index.html backend/templates/

# Run collectstatic to ensure all static files are collected
echo "Running collectstatic..."
cd backend
source venv/bin/activate
python manage.py collectstatic --noinput

echo "Done! All assets have been copied."
echo "Now reload your web app in the PythonAnywhere Web tab."

