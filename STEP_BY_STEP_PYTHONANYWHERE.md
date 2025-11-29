# Step-by-Step PythonAnywhere Setup Guide

Follow these steps in order to deploy your Dorsu Alumni Tracer application on PythonAnywhere.

---

## STEP 1: Create/Login to PythonAnywhere Account

1. Go to https://www.pythonanywhere.com
2. Sign up for a free account (or login if you already have one)
3. Note your username (you'll need it throughout the setup)

---

## STEP 2: Upload Your Project Files

### Option A: Using Git (Recommended if your project is on GitHub/GitLab)

1. In PythonAnywhere, go to the **Consoles** tab
2. Click **Bash** to open a console
3. Run these commands:
   ```bash
   cd ~
   git clone <your-repository-url>
   cd Dorsu-Alumni-Tracer-main
   ```
   (Replace `<your-repository-url>` with your actual Git repository URL)

### Option B: Using Files Tab (If not using Git)

1. Go to the **Files** tab in PythonAnywhere
2. Navigate to your home directory (`/home/yourusername/`)
3. Click **Upload a file** and upload your project files
4. Or use the **New directory** button to create folders and upload files manually

**Verify:** Your project should be at: `/home/yourusername/Dorsu-Alumni-Tracer-main/`

---

## STEP 3: Create Virtual Environment

1. In the **Bash console**, navigate to your backend directory:
   ```bash
   cd ~/Dorsu-Alumni-Tracer-main/backend
   ```

2. Create a virtual environment:
   ```bash
   python3.10 -m venv venv
   ```
   (If Python 3.10 isn't available, try `python3.11` or `python3.9`)

3. Activate the virtual environment:
   ```bash
   source venv/bin/activate
   ```
   You should see `(venv)` at the beginning of your command prompt

4. Upgrade pip:
   ```bash
   pip install --upgrade pip
   ```

---

## STEP 4: Install Python Dependencies

1. Make sure your virtual environment is activated (you should see `(venv)` in your prompt)

2. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

3. If `mysqlclient` installation fails, try:
   ```bash
   pip install --upgrade pip setuptools wheel
   pip install mysqlclient
   ```

4. Verify installation:
   ```bash
   pip list
   ```
   You should see Django, djangorestframework, django-cors-headers, mysqlclient, and Pillow

---

## STEP 5: Set Up MySQL Database

1. Go to the **Databases** tab in PythonAnywhere

2. Click **Create a database** (or use an existing one)

3. Set a password for your database (remember this!)

4. Note your database details:
   - **Database name format**: `yourusername$alumni_dbs`
     - Example: If your username is `john`, the database name is `john$alumni_dbs`
   - **Username**: Your PythonAnywhere username
   - **Password**: The password you just set
   - **Host**: `yourusername.mysql.pythonanywhere-services.com`

5. (Optional) If you need to create the database manually, open MySQL console:
   ```bash
   mysql -u yourusername -p
   ```
   Then run:
   ```sql
   CREATE DATABASE yourusername$alumni_dbs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   EXIT;
   ```

---

## STEP 6: Configure Django Settings

1. In the **Files** tab, navigate to:
   ```
   /home/yourusername/Dorsu-Alumni-Tracer-main/backend/alumni_backend/settings.py
   ```

2. Click on `settings.py` to open it

3. Update the following sections:

   **a) SECRET_KEY** - Generate a new one:
   - Open a Bash console
   - Run: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`
   - Copy the generated key
   - In settings.py, replace the SECRET_KEY value with the new one

   **b) DEBUG** - Change to False:
   ```python
   DEBUG = False
   ```

   **c) ALLOWED_HOSTS** - Add your PythonAnywhere domain:
   ```python
   ALLOWED_HOSTS = [
       'yourusername.pythonanywhere.com',  # Replace 'yourusername' with your actual username
       'www.yourusername.pythonanywhere.com',
   ]
   ```

   **d) DATABASES** - Update with your MySQL credentials:
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.mysql',
           'NAME': 'yourusername$alumni_dbs',  # Format: username$dbname
           'USER': 'yourusername',  # Your PythonAnywhere username
           'PASSWORD': 'your-database-password',  # The password you set in Step 5
           'HOST': 'yourusername.mysql.pythonanywhere-services.com',
           'PORT': '3306',
           'OPTIONS': {
               'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
               'charset': 'utf8mb4',
           },
       }
   }
   ```

   **e) STATIC_ROOT** - Add this line:
   ```python
   STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
   ```
   (Add `import os` at the top if it's not already there)

   **f) CORS settings** - Update for production:
   ```python
   # Remove or comment out this line:
   # CORS_ALLOW_ALL_ORIGINS = True
   
   # Add this instead:
   CORS_ALLOWED_ORIGINS = [
       "https://yourusername.pythonanywhere.com",
   ]
   ```

4. **Save** the file (Ctrl+S or click Save button)

---

## STEP 7: Run Database Migrations

1. Open a **Bash console**

2. Navigate to your backend directory:
   ```bash
   cd ~/Dorsu-Alumni-Tracer-main/backend
   ```

3. Activate your virtual environment:
   ```bash
   source venv/bin/activate
   ```

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. (Optional) Create a superuser for admin access:
   ```bash
   python manage.py createsuperuser
   ```
   Follow the prompts to create an admin account

6. (Optional) If you have existing data to import:
   ```bash
   mysql -u yourusername -p yourusername$alumni_dbs < alumni.sql
   ```

---

## STEP 8: Collect Static Files

1. In the same Bash console (with venv activated), run:
   ```bash
   python manage.py collectstatic --noinput
   ```

2. This creates a `staticfiles` directory with all static files

---

## STEP 9: Configure WSGI File

1. Go to the **Web** tab in PythonAnywhere

2. Click on the **WSGI configuration file** link (usually shows something like `/var/www/yourusername_pythonanywhere_com_wsgi.py`)

3. **Delete all the existing content** in that file

4. **Replace it with** this code (replace `yourusername` with your actual username):
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

5. **Save** the file

---

## STEP 10: Configure Static and Media Files

1. Still in the **Web** tab, scroll down to find the **Static files** section

2. Click **Add a new mapping**

3. For **Static files**:
   - **URL**: `/static/`
   - **Directory**: `/home/yourusername/Dorsu-Alumni-Tracer-main/backend/staticfiles/`
   - Click **Add**

4. For **Media files**:
   - Click **Add a new mapping** again
   - **URL**: `/media/`
   - **Directory**: `/home/yourusername/Dorsu-Alumni-Tracer-main/backend/media/`
   - Click **Add**

5. **Important**: Replace `yourusername` with your actual PythonAnywhere username in both paths

---

## STEP 11: Reload Your Web App

1. Still in the **Web** tab, scroll to the top

2. Click the big green **Reload** button

3. Wait a few seconds for the reload to complete

---

## STEP 12: Test Your Application

1. Go to your web app URL:
   ```
   https://yourusername.pythonanywhere.com
   ```

2. Test the admin panel:
   ```
   https://yourusername.pythonanywhere.com/admin/
   ```
   Login with the superuser you created in Step 7

3. Test an API endpoint:
   ```
   https://yourusername.pythonanywhere.com/api/
   ```

---

## STEP 13: Set Up Frontend (React App)

You have two options:

### Option A: Build React App and Serve from Django

1. In Bash console, navigate to frontend:
   ```bash
   cd ~/Dorsu-Alumni-Tracer-main/frontend
   ```

2. Install Node.js dependencies (if Node.js is available on PythonAnywhere):
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

5. Update Django to serve the React app:
   - In `backend/alumni_backend/urls.py`, add at the end of urlpatterns:
     ```python
     from django.views.generic import TemplateView
     
     urlpatterns += [
         path('', TemplateView.as_view(template_name='index.html')),
     ]
     ```
   - Create templates directory:
     ```bash
     mkdir -p ~/Dorsu-Alumni-Tracer-main/backend/templates
     cp ~/Dorsu-Alumni-Tracer-main/frontend/build/index.html ~/Dorsu-Alumni-Tracer-main/backend/templates/
     ```
   - Update settings.py TEMPLATES DIRS:
     ```python
     'DIRS': [BASE_DIR / 'templates'],
     ```

6. Run collectstatic again:
   ```bash
   cd ~/Dorsu-Alumni-Tracer-main/backend
   source venv/bin/activate
   python manage.py collectstatic --noinput
   ```

7. Reload web app in Web tab

### Option B: Host Frontend Separately

If hosting frontend on Netlify, Vercel, or another service:

1. Update `CORS_ALLOWED_ORIGINS` in settings.py with your frontend domain
2. Update API base URL in your React app's `apiBase.js` to point to:
   ```
   https://yourusername.pythonanywhere.com
   ```

---

## Troubleshooting

### If you see errors:

1. **Check Error Logs**:
   - Go to **Web** tab
   - Click on **Error log** link
   - Read the error messages

2. **Common Issues**:

   **"ModuleNotFoundError"**:
   - Make sure virtual environment is activated
   - Check that all packages are installed: `pip list`

   **"Database connection error"**:
   - Verify database credentials in settings.py
   - Check database name format: `username$dbname`
   - Ensure MySQL service is running

   **"Static files not found"**:
   - Run `collectstatic` again
   - Check static files mapping in Web tab
   - Verify file paths are correct

   **"500 Internal Server Error"**:
   - Check error log in Web tab
   - Temporarily set `DEBUG = True` to see detailed errors
   - Remember to set it back to `False` after fixing

3. **View Logs**:
   - **Error log**: Web tab → Error log
   - **Server log**: Web tab → Server log
   - **Access log**: Web tab → Access log

---

## Security Checklist

Before going live, make sure:

- [ ] `DEBUG = False` in settings.py
- [ ] New `SECRET_KEY` generated and set
- [ ] `ALLOWED_HOSTS` contains your actual domain
- [ ] `CORS_ALLOWED_ORIGINS` is configured (not `CORS_ALLOW_ALL_ORIGINS = True`)
- [ ] Database password is strong
- [ ] Admin account has a strong password

---

## Quick Reference Commands

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

---

## Need Help?

- Check PythonAnywhere's error logs (Web tab → Error log)
- Review the detailed guide: `PYTHONANYWHERE_SETUP.md`
- PythonAnywhere Help: https://help.pythonanywhere.com/
- Django Deployment Checklist: https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

---

**Congratulations!** Your Django application should now be live on PythonAnywhere! 🎉

