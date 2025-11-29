# PythonAnywhere Quick Start Checklist

## Pre-Deployment Checklist

- [ ] PythonAnywhere account created
- [ ] Project files uploaded to PythonAnywhere
- [ ] Virtual environment created and activated
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] MySQL database created
- [ ] Database credentials noted

## Configuration Steps

1. **Update `backend/alumni_backend/settings.py`:**
   - [ ] Set `DEBUG = False`
   - [ ] Update `ALLOWED_HOSTS` with your domain
   - [ ] Update `DATABASES` with PythonAnywhere MySQL credentials
   - [ ] Update `STATIC_ROOT` path
   - [ ] Configure `CORS_ALLOWED_ORIGINS` (remove `CORS_ALLOW_ALL_ORIGINS`)

2. **Run Django Commands:**
   ```bash
   cd ~/Dorsu-Alumni-Tracer-main/backend
   source venv/bin/activate
   python manage.py migrate
   python manage.py collectstatic --noinput
   python manage.py createsuperuser  # Optional
   ```

3. **Configure WSGI File:**
   - [ ] Web tab → WSGI configuration
   - [ ] Update paths with your username
   - [ ] Save

4. **Configure Static/Media Files:**
   - [ ] Web tab → Static files mapping: `/static/` → `/home/yourusername/Dorsu-Alumni-Tracer-main/backend/staticfiles/`
   - [ ] Web tab → Media files mapping: `/media/` → `/home/yourusername/Dorsu-Alumni-Tracer-main/backend/media/`

5. **Reload Web App:**
   - [ ] Click "Reload" button in Web tab

## Test Your Deployment

- [ ] Visit: `https://yourusername.pythonanywhere.com`
- [ ] Test admin: `https://yourusername.pythonanywhere.com/admin/`
- [ ] Test API: `https://yourusername.pythonanywhere.com/api/`
- [ ] Check error logs if issues occur

## Important Settings to Update

Replace these placeholders in `settings.py`:
- `yourusername` → Your PythonAnywhere username
- `your-database-password` → Your MySQL password
- `your-new-secret-key-here` → Generate a new secret key

**Generate Secret Key:**
```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

## Common Commands

```bash
# Activate virtual environment
source ~/Dorsu-Alumni-Tracer-main/backend/venv/bin/activate

# Navigate to project
cd ~/Dorsu-Alumni-Tracer-main/backend

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Create superuser
python manage.py createsuperuser

# Check Django version
python manage.py version
```

## File Paths Reference

- Project root: `~/Dorsu-Alumni-Tracer-main/`
- Backend: `~/Dorsu-Alumni-Tracer-main/backend/`
- Settings: `~/Dorsu-Alumni-Tracer-main/backend/alumni_backend/settings.py`
- WSGI: `~/Dorsu-Alumni-Tracer-main/backend/alumni_backend/wsgi.py`
- Virtual env: `~/Dorsu-Alumni-Tracer-main/backend/venv/`

