"""
Example settings.py configuration for PythonAnywhere deployment.

IMPORTANT: This is an example file. Copy the relevant sections to your actual settings.py
and replace all placeholders with your actual values.

DO NOT commit your actual settings.py with real credentials to version control!
"""

import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
# Generate a new secret key for production:
# python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
SECRET_KEY = os.environ.get('SECRET_KEY', 'REPLACE-WITH-GENERATED-SECRET-KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False  # Set to False for production

# Update with your PythonAnywhere domain
ALLOWED_HOSTS = [
    'yourusername.pythonanywhere.com',  # Replace 'yourusername' with your actual username
    'www.yourusername.pythonanywhere.com',
    # Add your custom domain if you have one:
    # 'yourdomain.com',
    # 'www.yourdomain.com',
]

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'users',
    'posts',
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'alumni_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],  # Add templates directory if serving React app
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'alumni_backend.wsgi.application'

# Database
# PythonAnywhere MySQL database format: username$database_name
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'yourusername$alumni_dbs',  # Format: username$dbname
        'USER': 'yourusername',  # Your PythonAnywhere username
        'PASSWORD': 'YOUR-DATABASE-PASSWORD',  # Your MySQL password
        'HOST': 'yourusername.mysql.pythonanywhere-services.com',  # Format: username.mysql.pythonanywhere-services.com
        'PORT': '3306',
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4',
        },
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')  # Where collectstatic will put files

# Media files (for uploaded profile images)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS settings - IMPORTANT: Update for production!
# Option 1: Specific origins (RECOMMENDED for production)
CORS_ALLOWED_ORIGINS = [
    "https://yourusername.pythonanywhere.com",
    # Add your frontend domain if hosted separately:
    # "https://your-frontend-domain.com",
]

# Option 2: Allow all origins (NOT RECOMMENDED for production, use only for development)
# CORS_ALLOW_ALL_ORIGINS = True  # Remove or comment this out in production

# Additional CORS settings for production
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Django REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
}

# Security settings for production
if not DEBUG:
    SECURE_SSL_REDIRECT = False  # PythonAnywhere handles SSL
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'

