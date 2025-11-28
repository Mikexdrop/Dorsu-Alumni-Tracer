from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Count, Q, Value, IntegerField
from .models import Post, PostImage, Like
from .serializers import PostSerializer, LikeSerializer
from rest_framework import generics, permissions
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import status


# Helper to detect acting role (supports header X-Acting-Role or request.data.acting_user_type)
def _get_acting_role(request):
    try:
        role = request.META.get('HTTP_X_ACTING_ROLE')
        if role:
            return role.lower()
        if hasattr(request, 'data') and isinstance(request.data, dict):
            r = request.data.get('acting_user_type') or request.data.get('acting_role')
            if r:
                return str(r).lower()
    except Exception:
        pass
    return None


class PostListCreateView(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        # annotate with likes_count and whether current user liked the post
        user_id = None
        try:
            # Try DRF auth user id on request.user if available
            if hasattr(self.request, 'user') and self.request.user and getattr(self.request.user, 'is_authenticated', False):
                user_id = getattr(self.request.user, 'id', None)
        except Exception:
            user_id = None

        qs = Post.objects.all().order_by('-created_at').annotate(
            likes_count=Count('likes'),
            liked=Count('likes', filter=Q(likes__user_id=user_id))
        )
        return qs
    def create(self, request, *args, **kwargs):
        title = request.data.get('title')
        content = request.data.get('content')

        if not title or not content:
            return Response({'detail': 'Title and content are required'}, status=status.HTTP_400_BAD_REQUEST)

        post = Post.objects.create(title=title, content=content)

        # Handle images: expect files under keys like images[0], images[1], ... or 'images'
        # We'll iterate over uploaded files in request.FILES
        files = request.FILES.getlist('images') or []
        # Also accept images[] style
        if not files:
            files = [v for k, v in request.FILES.items() if k.startswith('images')]

        for f in files:
            PostImage.objects.create(post=post, image=f)

        serializer = PostSerializer(post, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LikeToggleView(generics.GenericAPIView):
    serializer_class = LikeSerializer

    def post(self, request, post_id):
        # Allow both authenticated and token-based clients; prefer request.user.id
        user_id = None
        if hasattr(request, 'user') and getattr(request.user, 'is_authenticated', False):
            user_id = getattr(request.user, 'id', None)
        else:
            # fallback to client-provided userId (not ideal) — keep for backward compatibility
            try:
                user_id = int(request.data.get('user_id') or request.data.get('author_id'))
            except Exception:
                user_id = None

        if not user_id:
            return Response({'detail': 'Authentication required to like posts'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({'detail': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

        like, created = Like.objects.get_or_create(post=post, user_id=user_id)
        if not created:
            # already exists: remove (toggle)
            like.delete()
            return Response({'liked': False}, status=status.HTTP_200_OK)
        return Response({'liked': True}, status=status.HTTP_201_CREATED)


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update (PATCH) or destroy a single Post instance.

    PATCH will accept multipart/form-data to allow appending uploaded images.
    When updating, we update title/content if provided and append any uploaded files
    as new PostImage instances. We return the serialized post.
    """
    serializer_class = PostSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = (permissions.AllowAny,)

    def get_object(self):
        post_id = self.kwargs.get('post_id')
        return get_object_or_404(Post, id=post_id)

    def patch(self, request, *args, **kwargs):
        post = self.get_object()
        # For program heads, restrict updates to 'status' field only (if such workflow exists)
        acting_role = _get_acting_role(request)
        if acting_role and acting_role.startswith('program'):
            # Only allow changing 'status' by program heads
            status_val = request.data.get('status', None)
            if status_val is None:
                return Response({'detail': 'Program heads may only update post status.'}, status=status.HTTP_403_FORBIDDEN)
            # apply status if model has attribute
            if hasattr(post, 'status'):
                post.status = status_val
                post.save()
            else:
                return Response({'detail': 'Post does not support status updates.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # update simple fields
            title = request.data.get('title', None)
            content = request.data.get('content', None)
            if title is not None:
                post.title = title
            if content is not None:
                post.content = content
            post.save()
        post.save()

        # Handle uploaded images: accept request.FILES similar to create
        files = request.FILES.getlist('images') or []
        if not files:
            files = [v for k, v in request.FILES.items() if k.startswith('images')]
        for f in files:
            PostImage.objects.create(post=post, image=f)

        serializer = PostSerializer(post, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, *args, **kwargs):
        # Prevent program heads from deleting posts
        acting_role = _get_acting_role(request)
        if acting_role and acting_role.startswith('program'):
            return Response({'detail': 'Program heads are not authorized to delete posts.'}, status=status.HTTP_403_FORBIDDEN)
        post = self.get_object()
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
