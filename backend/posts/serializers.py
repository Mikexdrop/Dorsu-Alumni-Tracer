from rest_framework import serializers
from .models import Post, PostImage, Comment


class PostImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostImage
        fields = ('id', 'image')


class CommentSerializer(serializers.ModelSerializer):
    author_full_name = serializers.SerializerMethodField(read_only=True)
    author_image = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = __import__('posts.models', fromlist=['Comment']).Comment
        fields = ('id', 'post', 'author_name', 'author_id', 'author_full_name', 'author_image', 'text', 'created_at')

    def get_author_full_name(self, obj):
        # Try to resolve an Alumni record for richer display
        try:
            from ..users.models import Alumni
            if obj.author_id:
                a = Alumni.objects.filter(id=obj.author_id).first()
                if a:
                    return getattr(a, 'full_name', None) or getattr(a, 'username', None)
        except Exception:
            pass
        # fallback to stored author_name
        return obj.author_name

    def get_author_image(self, obj):
        try:
            from ..users.models import Alumni
            request = self.context.get('request') if hasattr(self, 'context') else None
            if obj.author_id:
                a = Alumni.objects.filter(id=obj.author_id).first()
                if a and getattr(a, 'image'):
                    # build absolute URI if request present
                    try:
                        if request:
                            return request.build_absolute_uri(a.image.url)
                        return a.image.url
                    except Exception:
                        return getattr(a.image, 'url', None)
        except Exception:
            pass
        return None


class PostSerializer(serializers.ModelSerializer):
    images = PostImageSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    liked = serializers.BooleanField(read_only=True)

    class Meta:
        model = Post
        fields = ('id', 'title', 'content', 'created_at', 'images', 'comments', 'likes_count', 'liked')


class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = __import__('posts.models', fromlist=['Like']).Like
        fields = ('id', 'post', 'user_id', 'created_at')
