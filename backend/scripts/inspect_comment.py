import os, django, json
os.environ.setdefault('DJANGO_SETTINGS_MODULE','alumni_backend.settings')
django.setup()
from posts.models import Comment
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
User = get_user_model()

c = list(Comment.objects.filter(pk=24).values('id','post_id','author_id','author_name','text','created_at'))
print('COMMENT:', json.dumps(c, default=str))
try:
    toks = list(Token.objects.all().values('user_id','key'))[:50]
except Exception as e:
    toks = str(e)
print('TOKENS:', json.dumps(toks, default=str))
print('author_id:', c[0].get('author_id') if c else None)
if c and c[0].get('author_id'):
    u = list(User.objects.filter(pk=c[0].get('author_id')).values('id','username'))
    print('USER:', json.dumps(u, default=str))
else:
    print('No author_id or comment not found')
