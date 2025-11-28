from django.urls import path
from .views import PostListCreateView, PostDetailView
from .comment_views import CommentListCreateView, CommentDetailView
from .views import LikeToggleView

urlpatterns = [
    path('posts/', PostListCreateView.as_view(), name='post-list-create'),
    path('posts/<int:post_id>/comments/', CommentListCreateView.as_view(), name='post-comments'),
    path('posts/<int:post_id>/comments/<int:pk>/', CommentDetailView.as_view(), name='post-comment-detail'),
    path('posts/<int:post_id>/likes/toggle/', LikeToggleView.as_view(), name='post-like-toggle'),
    path('posts/<int:post_id>/', PostDetailView.as_view(), name='post-detail'),
]
