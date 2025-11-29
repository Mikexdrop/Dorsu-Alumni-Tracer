# PythonAnywhere Setup Guide for Dorsu Alumni Tracer

This guide will walk you through deploying the Dorsu Alumni Tracer application on PythonAnywhere.

## Prerequisites

1. A PythonAnywhere account (free tier or paid)
2. Your project files uploaded to PythonAnywhere
3. Basic knowledge of Django and MySQL

---

## Step 1: Upload Your Project Files

### Option A: Using Git (Recommended)
1. In PythonAnywhere's Bash console, navigate to your home directory:
   ```bash
   cd ~
   ```

2. Clone your repository (if using Git):
   ```bash
   git clone <your-repository-url>
   cd Dorsu-Alumni-Tracer-main
   ```

### Option B: Using Files Tab
1. Go to the **Files** tab in PythonAnywhere
2. Upload your project files to your home directory
3. Extract if needed

---

## Step 2: Set Up Virtual Environment

1. In the Bash console, navigate to your project:
   ```bash
   cd ~/Dorsu-Alumni-Tracer-main/backend
   ```

2. Create a virtual environment:
   ```bash
   python3.10 -m venv venv
   # or python3.11 -m venv venv (depending on PythonAnywhere's available versions)
   ```

3. Activate the virtual environment:
   ```bash
   source venv/bin/activate
   ```

4. Upgrade pip:
   ```bash
   pip install --upgrade pip
   ```

5. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

**Note:** If `mysqlclient` installation fails, you may need to install system dependencies first:
   ```bash
   pip install --upgrade pip setuptools wheel
   pip install mysqlclient
   ```

---

## Step 3: Set Up MySQL Database

1. Go to the **Databases** tab in PythonAnywhere
2. Click **Create a database** (if you don't have one)
3. Note your database credentials:
   - Database name: `yourusername$alumni_dbs` (format: `username$dbname`)
   - Username: `yourusername`
   - Password: (the one you set)
   - Host: `yourusername.mysql.pythonanywhere-services.com`

4. Alternatively, you can create the database via MySQL console:
   ```bash
   mysql -u yourusername -p
   ```
   Then:
   ```sql
   CREATE DATABASE yourusername$alumni_dbs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   EXIT;
   ```

---

## Step 4: Configure Django Settings

1. Navigate to your settings file:
   ```bash
   cd ~/Dorsu-Alumni-Tracer-main/backend
   nano alumni_backend/settings.py
   ```

2. Update the following settings:

   ```python
   import os
   
   # Update SECRET_KEY (generate a new one for production)
   SECRET_KEY = os.environ.get('SECRET_KEY', 'your-new-secret-key-here')
   
   # Set DEBUG to False for production
   DEBUG = False
   
   # Update ALLOWED_HOSTS with your PythonAnywhere domain
   ALLOWED_HOSTS = [
       'yourusername.pythonanywhere.com',
       'www.yourusername.pythonanywhere.com',
       # Add your custom domain if you have one
   ]
   
   # Update DATABASES configuration
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.mysql',
           'NAME': 'yourusername$alumni_dbs',  # Format: username$dbname
           'USER': 'yourusername',
           'PASSWORD': 'your-database-password',
           'HOST': 'yourusername.mysql.pythonanywhere-services.com',
           'PORT': '3306',
           'OPTIONS': {
               'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
               'charset': 'utf8mb4',
           },
       }
   }
   
   # Update static files configuration
   STATIC_URL = '/static/'
   STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
   
   # Media files configuration
   MEDIA_URL = '/media/'
   MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
   
   # CORS settings - Update for production
   CORS_ALLOWED_ORIGINS = [
       "https://yourusername.pythonanywhere.com",
       # Add your frontend domain if hosted separately
   ]
   # Or keep CORS_ALLOW_ALL_ORIGINS = True for development (NOT recommended for production)
   ```

3. Save the file (Ctrl+X, then Y, then Enter in nano)

---

## Step 5: Run Database Migrations

1. Make sure your virtual environment is activated:
   ```bash
   source ~/Dorsu-Alumni-Tracer-main/backend/venv/bin/activate
   ```

2. Navigate to the backend directory:
   ```bash
   cd ~/Dorsu-Alumni-Tracer-main/backend
   ```

3. Run migrations:
   ```bash
   python manage.py migrate
   ```

4. Create a superuser (optional, for admin access):
   ```bash
   python manage.py createsuperuser
   ```

5. If you have existing data to import:
   ```bash
   python manage.py import_alumni  # If you have this management command
   # Or import your SQL file:
   mysql -u yourusername -p yourusername$alumni_dbs < alumni.sql
   ```

---

## Step 6: Collect Static Files

1. Collect all static files:
   ```bash
   python manage.py collectstatic --noinput
   ```

This will create a `staticfiles` directory with all your static files.

---

## Step 7: Configure WSGI File

1. Go to the **Web** tab in PythonAnywhere
2. Click on **WSGI configuration file** link
3. Delete the default content and replace with:

   ```python
   import os
   import sys
   
   # Add your project directory to the path
   path = '/home/yourusername/Dorsu-Alumni-Tracer-main/backend'
   if path not in sys.path:
       sys.path.insert(0, path)
   
   # Activate virtual environment
   activate_this = '/home/yourusername/Dorsu-Alumni-Tracer-main/backend/venv/bin/activate_this.py'
   with open(activate_this) as f:
       exec(f.read(), {'__file__': activate_this})
   
   # Set Django settings module
   os.environ['DJANGO_SETTINGS_MODULE'] = 'alumni_backend.settings'
   
   # Import Django WSGI application
   from django.core.wsgi import get_wsgi_application
   application = get_wsgi_application()
   ```

4. **Important:** Replace `yourusername` with your actual PythonAnywhere username
5. Click **Save**

---

## Step 8: Configure Web App Settings

1. In the **Web** tab, scroll down to find:
   - **Static files**: Add a mapping
     - URL: `/static/`
     - Directory: `/home/yourusername/Dorsu-Alumni-Tracer-main/backend/staticfiles/`
   
   - **Media files**: Add a mapping
     - URL: `/media/`
     - Directory: `/home/yourusername/Dorsu-Alumni-Tracer-main/backend/media/`

2. Set your domain (if you have a custom domain, add it in the **Domains** section)

3. Click **Reload** button to apply changes

---

## Step 9: Set Up Frontend (React App)

### Option A: Build and Serve Static Files from Django

1. Navigate to frontend directory:
   ```bash
   cd ~/Dorsu-Alumni-Tracer-main/frontend
   ```

2. Install Node.js dependencies (if Node.js is available):
   ```bash
   npm install
   ```

3. Build the React app:
   ```bash
   npm run build
   ```

4. Copy build files to Django static directory:
   ```bash
   cp -r build/* ../backend/staticfiles/
   ```

5. Update Django settings to serve the React app:
   - In `alumni_backend/urls.py`, add:
     ```python
     from django.views.generic import TemplateView
     
     urlpatterns = [
         # ... existing patterns ...
         path('', TemplateView.as_view(template_name='index.html')),
     ]
     ```
   - Create a templates directory and copy `index.html`:
     ```bash
     mkdir -p ~/Dorsu-Alumni-Tracer-main/backend/templates
     cp ~/Dorsu-Alumni-Tracer-main/frontend/build/index.html ~/Dorsu-Alumni-Tracer-main/backend/templates/
     ```

### Option B: Host Frontend Separately

If you're hosting the frontend on a different service (like Netlify, Vercel, or another PythonAnywhere web app):

1. Update `CORS_ALLOWED_ORIGINS` in settings.py with your frontend domain
2. Update the API base URL in your React app's `apiBase.js` to point to your PythonAnywhere backend

---

## Step 10: Test Your Application

1. Go to your web app URL: `https://yourusername.pythonanywhere.com`
2. Test the admin panel: `https://yourusername.pythonanywhere.com/admin/`
3. Test API endpoints: `https://yourusername.pythonanywhere.com/api/`

---

## Troubleshooting

### Common Issues:

1. **Import Errors:**
   - Make sure your virtual environment is activated
   - Check that all packages are installed: `pip list`

2. **Database Connection Errors:**
   - Verify database credentials in settings.py
   - Check that database name follows `username$dbname` format
   - Ensure MySQL service is running

3. **Static Files Not Loading:**
   - Run `collectstatic` again
   - Check static files mapping in Web tab
   - Verify file permissions

4. **Media Files Not Uploading:**
   - Check media files mapping in Web tab
   - Verify directory permissions: `chmod 755 media/`

5. **CORS Errors:**
   - Update `CORS_ALLOWED_ORIGINS` with your frontend domain
   - Check browser console for specific error messages

6. **500 Internal Server Error:**
   - Check error logs in the **Web** tab → **Error log**
   - Enable DEBUG temporarily to see detailed errors (remember to disable it after)

### Viewing Logs:

- **Error log**: Web tab → Error log
- **Server log**: Web tab → Server log
- **Access log**: Web tab → Access log

---

## Security Checklist

Before going live:

- [ ] Set `DEBUG = False` in settings.py
- [ ] Generate a new `SECRET_KEY` and store it securely
- [ ] Update `ALLOWED_HOSTS` with your actual domain
- [ ] Configure `CORS_ALLOWED_ORIGINS` properly (don't use `CORS_ALLOW_ALL_ORIGINS = True` in production)
- [ ] Use strong database passwords
- [ ] Set up HTTPS (PythonAnywhere provides this automatically)
- [ ] Review and secure admin panel access

---

## Additional Resources

- [PythonAnywhere Django Help](https://help.pythonanywhere.com/pages/Django/)
- [PythonAnywhere MySQL Help](https://help.pythonanywhere.com/pages/MySQL/)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/)

---

## Notes

- Free accounts on PythonAnywhere have limitations (1 web app, limited CPU time)
- Consider upgrading to a paid plan for production use
- PythonAnywhere automatically handles HTTPS/SSL certificates
- Scheduled tasks can be set up in the **Tasks** tab for periodic jobs

---

## Support

If you encounter issues:
1. Check PythonAnywhere's error logs
2. Review Django's error messages
3. Consult PythonAnywhere's help documentation
4. Check the project's GitHub issues (if applicable)

