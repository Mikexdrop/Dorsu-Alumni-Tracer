from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from backend.users.models import ProgramHead


class ProgramHeadCreateTest(TestCase):
	def setUp(self):
		self.client = APIClient()

	def test_create_program_head(self):
		url = '/api/program-heads/'
		payload = {
			'username': 'ph_test_1',
			'password': 'secret123',
			'name': 'Test',
			'surname': 'ProgramHead',
			'mi': 'A',
			'gender': 'male',
			'contact': '09123456789',
			'email': 'ph_test1@example.com',
			'faculty': 'FICT',
			'program': 'Computer Science',
			'status': 'approved'
		}

		resp = self.client.post(url, payload, format='json')
		# Expect created (201) or OK (200) depending on view behavior
		self.assertIn(resp.status_code, (status.HTTP_201_CREATED, status.HTTP_200_OK))

		# Verify the ProgramHead instance exists in DB
		exists = ProgramHead.objects.filter(username='ph_test_1', email='ph_test1@example.com').exists()
		self.assertTrue(exists)


class ProgramHeadPermissionsTest(TestCase):
	def setUp(self):
		self.client = APIClient()
		# create two program heads: one is the target, the other acts
		self.target = ProgramHead.objects.create(
			username='ph_target', password='x', name='T', surname='Target', mi='A', gender='male', contact='0912', email='ph_target@example.com', faculty='F', program='P', status='pending'
		)
		self.actor = ProgramHead.objects.create(
			username='ph_actor', password='x', name='A', surname='Actor', mi='B', gender='female', contact='0913', email='ph_actor@example.com', faculty='F', program='P', status='approved'
		)

	def test_program_head_cannot_delete_program_head(self):
		url = f'/api/program-heads/{self.target.id}/'
		# Acting program head attempts to delete target. Indicate acting role in payload
		resp = self.client.delete(url, data={'acting_user_type': 'program_head'}, format='json')
		self.assertEqual(resp.status_code, 403)

	def test_program_head_can_only_update_status(self):
		url = f'/api/program-heads/{self.target.id}/'
		# Try to update non-status field as program head
		resp = self.client.patch(url, data={'name': 'Hacked', 'acting_user_type': 'program_head'}, format='json')
		# Our backend allows update only of status for program heads; name change should not be allowed and treated as forbidden or ignored.
		# The implementation blocks delete but for updates we implemented status-only behavior on posts; ProgramHeadDetailView uses default serializer update — so ensure we at least cannot change status except via admin.
		# Expect either 200 with no name change, or 403. We'll assert name not changed in DB.
		self.assertIn(resp.status_code, (200, 400, 403))
		self.target.refresh_from_db()
		self.assertNotEqual(self.target.name, 'Hacked')

	def test_program_head_can_update_status_field_when_supported(self):
		# Some endpoints rely on status field update; program head should be able to change status on a ProgramHead via PATCH if backend permits status-only change.
		url = f'/api/program-heads/{self.target.id}/'
		resp = self.client.patch(url, data={'status': 'approved', 'acting_user_type': 'program_head'}, format='json')
		# Accept 200 or 204 depending on view
		self.assertIn(resp.status_code, (200, 202, 204))
		self.target.refresh_from_db()
		self.assertEqual(self.target.status, 'approved')

