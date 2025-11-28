from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework import status
from .models import Comment, Post
from .serializers import CommentSerializer
from rest_framework.response import Response
from rest_framework import status


# Helper to detect acting role via header or request payload
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


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        post_id = self.kwargs.get('post_id')
        return Comment.objects.filter(post_id=post_id).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        post_id = self.kwargs.get('post_id')
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({'detail': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data['post'] = post.id
        # If the request is authenticated, prefer server-side author attribution
        try:
            if hasattr(request, 'user') and getattr(request.user, 'is_authenticated', False):
                # Some auth flows map to a custom Alumni model; try to detect an alumni id attribute
                uid = getattr(request.user, 'id', None)
                if uid:
                    data['author_id'] = uid
                    # attempt to set a friendly name
                    name = getattr(request.user, 'full_name', None) or getattr(request.user, 'username', None)
                    if name:
                        data['author_name'] = name
        except Exception:
            pass

        serializer = self.get_serializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CommentDetailView(generics.RetrieveDestroyAPIView):
    """Retrieve or delete a single comment for a post.

    Deletion is allowed for the original author (matching author_id) or for staff/superusers.
    """
    serializer_class = CommentSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        post_id = self.kwargs.get('post_id')
        return Comment.objects.filter(post_id=post_id)

    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()
        # Prevent program heads from deleting arbitrary comments; they must act via author match
        acting_role = _get_acting_role(request)
        if acting_role and acting_role.startswith('program'):
            # allow only if the program head is the author (rare) - fall through to existing checks
            pass
        # allow deletion by matching author_id when request.user is authenticated
        try:
            user = getattr(request, 'user', None)
            allowed = False
            if user and getattr(user, 'is_authenticated', False):
                # if comment.author_id exists and equals user's id
                if comment.author_id and int(comment.author_id) == int(getattr(user, 'id', -1)):
                    allowed = True
                # staff or superuser may delete
                if getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False):
                    allowed = True
        except Exception:
            allowed = False

        # also allow when request provides a token-based author_id in body (best-effort for API clients)
        if not allowed:
            try:
                body = request.data or {}
                if str(body.get('author_id') or '') == str(comment.author_id or ''):
                    allowed = True
            except Exception:
                pass

        if not allowed:
            return Response({'detail': 'Not authorized to delete this comment.'}, status=status.HTTP_403_FORBIDDEN)

        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
