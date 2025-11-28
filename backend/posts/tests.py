from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from backend.posts.models import Post, Comment

class PostPermissionsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.post = Post.objects.create(title='T', content='C')
        self.comment = Comment.objects.create(post=self.post, author_id=999, author_name='Anon', text='Hello')

    def test_program_head_cannot_delete_post(self):
        url = f'/api/posts/{self.post.id}/'
        resp = self.client.delete(url, data={'acting_user_type': 'program_head'}, format='json')
        self.assertEqual(resp.status_code, 403)

    def test_program_head_can_only_change_post_status_when_supported(self):
        url = f'/api/posts/{self.post.id}/'
        # Attempt to change title (should be forbidden for program head) and status (if supported)
        resp = self.client.patch(url, data={'title': 'Hacked', 'status': 'approved', 'acting_user_type': 'program_head'}, format='json')
        # If Post doesn't have status field, backend should return 400 for status update; ensure title did not change
        self.assertIn(resp.status_code, (200, 400, 403))
        self.post.refresh_from_db()
        self.assertNotEqual(self.post.title, 'Hacked')

    def test_program_head_cannot_delete_comment_unless_author(self):
        url = f'/api/posts/{self.post.id}/comments/{self.comment.id}/'
        resp = self.client.delete(url, data={'acting_user_type': 'program_head'}, format='json')
        # Should be forbidden because acting program head is not the author nor staff
        self.assertEqual(resp.status_code, 403)
