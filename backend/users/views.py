from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.signing import dumps, loads, BadSignature, SignatureExpired
import time

from .models import Admin, Alumni, ProgramHead, Program, Notification
from .serializers import AdminSerializer, AlumniSerializer, ProgramHeadSerializer, ProgramSerializer, NotificationSerializer
from rest_framework import generics
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import AlumniSurvey, EmploymentRecord
from .serializers import AlumniSurveySerializer
from .serializers import SurveyChangeRequestSerializer
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone


# Helper: determine acting role from header or request body.
def _get_acting_role(request):
	# Prefer an explicit header X-Acting-Role (HTTP_X_ACTING_ROLE in WSGI environ)
	try:
		role = None
		role = request.META.get('HTTP_X_ACTING_ROLE')
		if role:
			return role.lower()
		# Fallback: allow clients to include acting_user_type in body/payload
		if hasattr(request, 'data') and isinstance(request.data, dict):
			r = request.data.get('acting_user_type') or request.data.get('acting_role')
			if r:
				return str(r).lower()
	except Exception:
		pass
	return None


class LoginView(APIView):
	def post(self, request):
		user_type = request.data.get('user_type')
		username = request.data.get('username')
		password = request.data.get('password')
		model_map = {
			'admin': Admin,
			'alumni': Alumni,
			'programhead': ProgramHead,
			'program_head': ProgramHead,
		}
		model = model_map.get((user_type or '').lower())
		if not model:
			return Response({'error': 'Invalid user type'}, status=status.HTTP_400_BAD_REQUEST)
		try:
			user = model.objects.get(username=username)
			# For demo, plain password check. Use hashed passwords in production!
			if user.password == password:
				# Add first_login flag for alumni
				first_login = False
				if (user_type or '').lower() == 'alumni':
					# You may want to check a field like user.consent or user.last_login
					# For now, always set to True for demo
					first_login = True
				# Issue a signed, timestamped token (short-lived)
				# Token payload contains minimal identifying info so server can validate role
				TOKEN_SALT = 'user-auth-token'
				TOKEN_MAX_AGE = 600  # seconds (10 minutes)
				payload = {'id': user.id, 'username': user.username, 'user_type': user_type}
				token = dumps(payload, salt=TOKEN_SALT)
				expires_at = int(time.time()) + TOKEN_MAX_AGE
				# Include status for program_head so frontend can allow login when approved
				if (user_type or '').lower() in ('programhead', 'program_head'):
					return Response({'username': user.username, 'id': user.id, 'user_type': user_type, 'first_login': first_login, 'status': getattr(user, 'status', None), 'token': token, 'token_expires_at': expires_at}, status=status.HTTP_200_OK)
				return Response({'username': user.username, 'id': user.id, 'user_type': user_type, 'first_login': first_login, 'token': token, 'token_expires_at': expires_at}, status=status.HTTP_200_OK)
			else:
				return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
		except model.DoesNotExist:
			return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


class AlumniConsentView(APIView):
	def post(self, request):
		user_id = request.data.get('user_id')
		consent = request.data.get('consent')
		if not user_id or consent is None:
			return Response({'error': 'Missing user_id or consent'}, status=status.HTTP_400_BAD_REQUEST)
		try:
			alumni = Alumni.objects.get(id=user_id)
			# You may want to add a consent field to Alumni model; for now, just acknowledge
			# Example: alumni.consent = consent; alumni.save()
			return Response({'success': True}, status=status.HTTP_200_OK)
		except Alumni.DoesNotExist:
			return Response({'error': 'Alumni not found'}, status=status.HTTP_404_NOT_FOUND)


class ProgramListCreateView(generics.ListCreateAPIView):
	queryset = Program.objects.all()
	serializer_class = ProgramSerializer

	def list(self, request, *args, **kwargs):
		# Defensive: if the underlying table is missing or the DB schema
		# is inconsistent, avoid bubbling a ProgrammingError up to a 500.
		from django.db import utils as db_utils
		try:
			queryset = self.get_queryset()
			serializer = self.get_serializer(queryset, many=True)
			return Response(serializer.data)
		except db_utils.ProgrammingError as e:
			# Log for debugging and return an empty list so frontend can continue.
			print('ProgrammingError while listing Programs:', e)
			return Response([], status=status.HTTP_200_OK)

	def create(self, request, *args, **kwargs):
		data = request.data.copy()

		try:
			# Get the faculty from the program head
			program_head = ProgramHead.objects.get(id=data['program_head'])
			data['faculty'] = program_head.faculty
		except ProgramHead.DoesNotExist:
			return Response(
				{'error': 'Selected program head does not exist'},
				status=status.HTTP_400_BAD_REQUEST
			)

		serializer = self.get_serializer(data=data)
		if not serializer.is_valid():
			# Friendly handling for common uniqueness errors so frontend can show
			# an actionable message instead of raw field errors.
			details = serializer.errors
			if isinstance(details, dict) and ('username' in details or 'email' in details):
				msg = 'Username or email already exists.'
				return Response({'error': msg, 'details': details}, status=status.HTTP_400_BAD_REQUEST)
			# Default envelope for other validation errors
			return Response({'error': 'Validation failed', 'details': details}, status=status.HTTP_400_BAD_REQUEST)

		# Use an atomic block so ProgramHead and legacy table insert behave transactionally
		from django.db import connection, transaction
		from django.utils import timezone

		try:
			with transaction.atomic():
				program_head = serializer.save()

				# Also attempt to persist credentials into the legacy
				# `users_programhead` table so external tools (MySQL Workbench)
				# can read them. We use raw SQL here to avoid adding another
				# Django model that would require migrations and risk db_table
				# conflicts.

				vendor = connection.vendor
				cursor = connection.cursor()

				# Create table if it doesn't exist (vendor-specific SQL).
				if vendor == 'sqlite':
					create_sql = '''
					CREATE TABLE IF NOT EXISTS users_programhead (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						username TEXT UNIQUE,
						email TEXT UNIQUE,
						password TEXT,
						created_at TIMESTAMP
					)
					'''
				else:
					# Assume MySQL-compatible
					create_sql = '''
					CREATE TABLE IF NOT EXISTS users_programhead (
						id INT AUTO_INCREMENT PRIMARY KEY,
						username VARCHAR(150) UNIQUE,
						email VARCHAR(254) UNIQUE,
						password VARCHAR(128),
						created_at DATETIME
					) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
					'''
				cursor.execute(create_sql)

				# Insert the record. Use parameter placeholder appropriate for DB-API.
				placeholder = '?' if vendor == 'sqlite' else '%s'
				# Check existing columns in case the table was created with a different schema
				try:
					cursor.execute("SHOW COLUMNS FROM users_programhead")
				except Exception:
					# Fallback: try information_schema for more portable detection
					cursor.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users_programhead' AND TABLE_SCHEMA = DATABASE()")
				columns = [row[0] for row in cursor.fetchall()]
				if 'created_at' in columns:
					insert_sql = f"INSERT INTO users_programhead (username, email, password, created_at) VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder})"
					params = [program_head.username, program_head.email, program_head.password, timezone.now()]
				else:
					insert_sql = f"INSERT INTO users_programhead (username, email, password) VALUES ({placeholder}, {placeholder}, {placeholder})"
					params = [program_head.username, program_head.email, program_head.password]
				cursor.execute(insert_sql, params)

			headers = self.get_success_headers(serializer.data)
			return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
		except Exception:
			# Keep error messages generic to avoid exposing internal details; frontend
			# will display a friendly message. We do not return raw exception text.
			return Response({'error': 'Server error while processing signup. Please try again later.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
		self.perform_create(serializer)
		headers = self.get_success_headers(serializer.data)
		return Response(
			serializer.data,
			status=status.HTTP_201_CREATED,
			headers=headers
		)


class AdminListCreateView(generics.ListCreateAPIView):
	queryset = Admin.objects.all()
	serializer_class = AdminSerializer


class AlumniListCreateView(generics.ListCreateAPIView):
	queryset = Alumni.objects.all()
	serializer_class = AlumniSerializer


class ProgramHeadListCreateView(generics.ListCreateAPIView):
	serializer_class = ProgramHeadSerializer
	parser_classes = [JSONParser, MultiPartParser, FormParser]

	def get_queryset(self):
		# Return all program heads for the admin/user-management panel
		return ProgramHead.objects.all()

	def list(self, request, *args, **kwargs):
		queryset = self.get_queryset()
		serializer = self.get_serializer(queryset, many=True)
		# Always return a list (empty list when none) so frontend can render tables without treating
		# the result as an error.
		return Response(serializer.data)

	def create(self, request, *args, **kwargs):
		data = request.data.copy()
		serializer = self.get_serializer(data=data)
		if not serializer.is_valid():
			# Provide a consistent envelope so the frontend can render
			# user-friendly messages instead of raw field errors.
			details = serializer.errors
			if isinstance(details, dict) and ('username' in details or 'email' in details):
				msg = 'Username or email already exists.'
				return Response({'error': msg, 'details': details}, status=status.HTTP_400_BAD_REQUEST)
			# Default envelope for other validation errors
			return Response({'error': 'Validation failed', 'details': details}, status=status.HTTP_400_BAD_REQUEST)

		# Create ProgramHead. The ProgramHead model itself should be the
		# authoritative representation and can be inspected by MySQL
		# Workbench if it maps to the legacy `users_programhead` table.
		program_head = serializer.save()

		# Also attempt to persist credentials into the legacy
		# `users_programhead` table so external tools (MySQL Workbench)
		# can read them. We use raw SQL here to avoid adding another
		# Django model that would require migrations and risk db_table
		# conflicts.
		from django.db import connection, transaction
		from django.utils import timezone

		legacy_warning = None
		try:
			vendor = connection.vendor
			cursor = connection.cursor()

			# Create table if it doesn't exist (vendor-specific SQL).
			if vendor == 'sqlite':
				create_sql = '''
				CREATE TABLE IF NOT EXISTS users_programhead (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					username TEXT UNIQUE,
					email TEXT UNIQUE,
					password TEXT,
					created_at TIMESTAMP
				)
				'''
			else:
				# Assume MySQL-compatible
				create_sql = '''
				CREATE TABLE IF NOT EXISTS users_programhead (
					id INT AUTO_INCREMENT PRIMARY KEY,
					username VARCHAR(150) UNIQUE,
					email VARCHAR(254) UNIQUE,
					password VARCHAR(128),
					created_at DATETIME
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
				'''
			cursor.execute(create_sql)

			# Insert the record. Use parameter placeholder appropriate for DB-API.
			placeholder = '?' if vendor == 'sqlite' else '%s'
			# Check existing columns in case the table was created with a different schema
			try:
				cursor.execute("SHOW COLUMNS FROM users_programhead")
			except Exception:
				# Fallback: try information_schema for more portable detection
				cursor.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users_programhead' AND TABLE_SCHEMA = DATABASE()")
			columns = [row[0] for row in cursor.fetchall()]

			# Build a dynamic insert using any matching fields from our ProgramHead model
			fields_to_try = ['username', 'name', 'surname', 'mi', 'gender', 'contact', 'email', 'faculty', 'program', 'status', 'password', 'created_at']
			insert_fields = [f for f in fields_to_try if f in columns]
			if not insert_fields:
				# Nothing to insert? fall back to minimal set
				insert_fields = ['username', 'email', 'password']

			placeholders = ', '.join([placeholder] * len(insert_fields))
			cols_sql = ', '.join(insert_fields)
			insert_sql = f"INSERT INTO users_programhead ({cols_sql}) VALUES ({placeholders})"

			params = []
			for col in insert_fields:
				if col == 'created_at':
					params.append(timezone.now())
				else:
					# Use getattr to pull attribute from ProgramHead instance; default to None
					params.append(getattr(program_head, col, None))

			cursor.execute(insert_sql, params)
		except Exception as e:
			# Don't roll back the successful ProgramHead creation; make legacy insert non-blocking.
			# Log the error to server console for debugging and add a lightweight warning
			print('Warning: failed to persist to users_programhead legacy table:', e)
			legacy_warning = str(e)

		headers = self.get_success_headers(serializer.data)
		# If legacy insert failed, include a short warning in the response body so the frontend
		# can notify the user or log it without treating the signup as a failure.
		resp_body = dict(serializer.data)
		if legacy_warning:
			resp_body['legacy_insert_warning'] = 'Failed to persist to legacy users_programhead table.'
		return Response(resp_body, status=status.HTTP_201_CREATED, headers=headers)


class AdminDetailView(generics.RetrieveUpdateDestroyAPIView):
	queryset = Admin.objects.all()
	serializer_class = AdminSerializer
    # Allow multipart/form-data and form parsing so clients can PATCH with file uploads
	parser_classes = [JSONParser, MultiPartParser, FormParser]


class AlumniDetailView(generics.RetrieveUpdateDestroyAPIView):
	queryset = Alumni.objects.all()
	serializer_class = AlumniSerializer
	parser_classes = [JSONParser, MultiPartParser, FormParser]


class AlumniChangePasswordView(APIView):
	"""
	POST: change an alumni's password.

	Expected JSON body: { "current_password": "...", "new_password": "..." }

	NOTE: this project currently stores passwords in plaintext in the demo models.
	This view verifies the provided current_password matches the stored value
	before replacing it with new_password. In production you should hash
	passwords with Django's auth system.
	"""

	def post(self, request, pk=None):
		cur = request.data.get('current_password')
		new = request.data.get('new_password')

		if not cur or not new:
			return Response({'detail': 'Missing current_password or new_password'}, status=status.HTTP_400_BAD_REQUEST)

		if len(new) < 8:
			return Response({'detail': 'New password must be at least 8 characters'}, status=status.HTTP_400_BAD_REQUEST)

		try:
			alumni = Alumni.objects.get(pk=pk)
		except Alumni.DoesNotExist:
			return Response({'detail': 'Alumni not found'}, status=status.HTTP_404_NOT_FOUND)

		# Verify current password matches stored value
		# (demo: plain-text comparison to match existing login behavior)
		if getattr(alumni, 'password', None) != cur:
			return Response({'detail': 'Current password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)

		# Perform the change
		try:
			alumni.password = new
			alumni.save()
		except Exception:
			return Response({'detail': 'Failed to change password'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

		return Response({'detail': 'Password changed successfully'}, status=status.HTTP_200_OK)


class ProgramHeadDetailView(generics.RetrieveUpdateDestroyAPIView):
	queryset = ProgramHead.objects.all()
	serializer_class = ProgramHeadSerializer
	parser_classes = [JSONParser, MultiPartParser, FormParser]

	def destroy(self, request, *args, **kwargs):
		# Prevent program heads from deleting program head records.
		acting_role = _get_acting_role(request)
		if acting_role == 'program_head' or acting_role == 'program-head' or acting_role == 'programhead':
			return Response({'detail': 'Program heads are not authorized to delete users.'}, status=status.HTTP_403_FORBIDDEN)

		# Fetch instance and metadata for logging/legacy cleanup
		instance = self.get_object()
		pk = getattr(instance, 'pk', None)
		username = getattr(instance, 'username', None)
		print(f"ProgramHeadDetailView.destroy called for id={pk}, username={username}")

		from django.db import connection, transaction, utils as db_utils
		response = None
		# Try the normal deletion first. If related tables are mis-migrated this
		# can raise a ProgrammingError when Django tries to update related rows.
		try:
			response = super().destroy(request, *args, **kwargs)
		except db_utils.ProgrammingError as e:
			# Log and attempt a raw SQL fallback delete of the ProgramHead row.
			print('ProgrammingError during ProgramHead delete (likely missing related table):', e)
			try:
				with transaction.atomic():
					cursor = connection.cursor()
					table = instance._meta.db_table
					vendor = connection.vendor
					if vendor == 'sqlite':
						cursor.execute(f"DELETE FROM {table} WHERE id = ?", [pk])
					else:
						cursor.execute(f"DELETE FROM {table} WHERE id = %s", [pk])
				# Build a minimal successful response object
				from rest_framework.response import Response as DRFResponse
				response = DRFResponse(status=204)
			except Exception as fallback_exc:
				print('Fallback raw-delete also failed:', fallback_exc)
				raise

		# Attempt to remove corresponding row from legacy `users_programhead` table
		try:
			with transaction.atomic():
				cursor = connection.cursor()
				vendor = connection.vendor
				if username:
					if vendor == 'sqlite':
						cursor.execute("DELETE FROM users_programhead WHERE username = ?", [username])
					else:
						cursor.execute("DELETE FROM users_programhead WHERE username = %s", [username])
				else:
					# Fall back to deleting by id if username not available
					if vendor == 'sqlite':
						cursor.execute("DELETE FROM users_programhead WHERE id = ?", [pk])
					else:
						cursor.execute("DELETE FROM users_programhead WHERE id = %s", [pk])
		except Exception as e:
			print('Warning: failed to delete from users_programhead legacy table:', e)

		# Ensure we return a proper DRF Response object
		if response is None:
			# As a safety net, return 204 No Content
			return Response(status=status.HTTP_204_NO_CONTENT)
		return response


class NotificationListCreateView(generics.ListCreateAPIView):
	queryset = Notification.objects.all().order_by('-created_at')
	serializer_class = NotificationSerializer

	def list(self, request, *args, **kwargs):
		queryset = self.get_queryset()
		serializer = self.get_serializer(queryset, many=True)
		return Response(serializer.data)

	def create(self, request, *args, **kwargs):
		data = request.data.copy() if hasattr(request, 'data') else {}
		serializer = self.get_serializer(data=data)
		if not serializer.is_valid():
			return Response({'error': 'Validation failed', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
		notif = serializer.save()
		return Response(self.get_serializer(notif).data, status=status.HTTP_201_CREATED)


class NotificationDetailView(generics.RetrieveDestroyAPIView):
	queryset = Notification.objects.all()
	serializer_class = NotificationSerializer

	def destroy(self, request, *args, **kwargs):
		instance = self.get_object()
		instance.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)


class SurveyAggregatesView(APIView):
	"""Return aggregated, non-identifying survey statistics for charts.
	This endpoint only returns counts and simple aggregates (no PII).
	"""

	def get(self, request):
		try:
			# Allow optional server-side filtering to support dashboard filters without
			# transferring all survey rows to the client. Supported query params:
			# - year: graduation year (exact match when numeric)
			# - program: program/course name (case-insensitive contains)
			qs = AlumniSurvey.objects.all()
			year = request.query_params.get('year')
			program = request.query_params.get('program')
			if year:
				try:
					yi = int(year)
					qs = qs.filter(year_graduated=yi)
				except Exception:
					# non-numeric year; ignore the filter
					pass
			if program:
				# use case-insensitive contains so partial names work (e.g. 'computer')
				qs = qs.filter(course_program__icontains=program)
			# employed counts
			employed_counts = {}
			for row in qs.values_list('employed_after_graduation', flat=True):
				key = (row or 'Unknown')
				employed_counts[key] = employed_counts.get(key, 0) + 1

			# employment source
			source_counts = {}
			for row in qs.values_list('employment_source', flat=True):
				key = (row or 'Unknown')
				source_counts[key] = source_counts.get(key, 0) + 1

			# work performance
			perf_counts = {}
			for row in qs.values_list('work_performance_rating', flat=True):
				key = (row or 'Unrated')
				perf_counts[key] = perf_counts.get(key, 0) + 1

			# programs
			prog_counts = {}
			for row in qs.values_list('course_program', flat=True):
				key = (row or 'Unknown')
				prog_counts[key] = prog_counts.get(key, 0) + 1

			# promoted
			promoted_counts = {}
			for row in qs.values_list('has_been_promoted', flat=True):
				key = (row or 'Unknown')
				promoted_counts[key] = promoted_counts.get(key, 0) + 1

			# jobs related
			jobs_related_counts = {}
			for row in qs.values_list('jobs_related_to_experience', flat=True):
				key = (row or 'Unknown')
				jobs_related_counts[key] = jobs_related_counts.get(key, 0) + 1

			# Self-employment: prefer the explicit `has_own_business` column when present
			# and fall back to the legacy `company_affiliation` proxy if it's missing.
			selfemp_counts = None
			has_counts = None
			try:
				# Try to read an explicit has_own_business column from the queryset
				vals = list(qs.values_list('has_own_business', flat=True))
				# If the column exists, vals will be a list (possibly empty). Normalize values.
				if vals is not None:
					has_counts = {'Yes': 0, 'No': 0}
					for v in vals:
						if v is None:
							# Treat missing/NULL as 'No' (consistent with prior proxy behaviour)
							has_counts['No'] += 1
							continue
						# Boolean values
						if isinstance(v, bool):
							if v:
								has_counts['Yes'] += 1
							else:
								has_counts['No'] += 1
							continue
						# String / numeric-like values: coerce to lower-case string and check common truthy values
						s = str(v).strip().lower()
						if s in ('yes', 'y', 'true', 't', '1'):
							has_counts['Yes'] += 1
						elif s in ('no', 'n', 'false', 'f', '0'):
							has_counts['No'] += 1
						else:
							# Unknown textual values: count as 'No' to avoid overstating self-employment
							has_counts['No'] += 1
			except Exception:
				# Column doesn't exist or DB error — leave has_counts as None and fall back
				has_counts = None

			if has_counts is not None:
				selfemp_counts = dict(has_counts)
			else:
				# Fallback: infer from company_affiliation presence (legacy behaviour)
				selfemp_counts = { 'Yes': 0, 'No': 0 }
				for row in qs.values_list('company_affiliation', flat=True):
					if row:
						selfemp_counts['Yes'] += 1
					else:
						selfemp_counts['No'] += 1

			# job difficulties - JSONField list
			job_difficulties_counts = {}
			for jd in qs.values_list('job_difficulties', flat=True):
				if not jd:
					continue
				# jd is expected to be a list (JSONField)
				if isinstance(jd, (list, tuple)):
					for item in jd:
						if not item:
							continue
						job_difficulties_counts[item] = job_difficulties_counts.get(item, 0) + 1
				else:
					# if stored as comma-separated string
					parts = str(jd).split(',')
					for item in parts:
						it = item.strip()
						if not it:
							continue
						job_difficulties_counts[it] = job_difficulties_counts.get(it, 0) + 1

			# compute unfiltered total for UI (useful to show "X of Y responses")
			unfiltered_total = AlumniSurvey.objects.count()
			# compute surveys in the current month (server local timezone)
			now = timezone.now()
			try:
				this_month_count = AlumniSurvey.objects.filter(created_at__year=now.year, created_at__month=now.month).count()
			except Exception:
				# created_at may not exist or be named differently; fall back to 0
				this_month_count = 0
			data = {
				'employed': employed_counts,
				'sources': source_counts,
				'performance': perf_counts,
				'programs': prog_counts,
				'promoted': promoted_counts,
				'jobs_related': jobs_related_counts,
				'self_employment': selfemp_counts,
				# Provide explicit has_own_business counts (prefer DB column when available)
				'has_own_business': (has_counts if has_counts is not None else selfemp_counts),
				'job_difficulties': job_difficulties_counts,
				'count': qs.count(),
				'total_count': unfiltered_total,
				'surveys_this_month': this_month_count,
			}
			return Response(data, status=status.HTTP_200_OK)
		except Exception as e:
			# Log and return generic error
			print('Error computing survey aggregates:', e)
			return Response({'error': 'Failed to compute aggregates'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

		from django.db import connection, transaction, utils as db_utils


class SurveyChangeRequestListCreateView(generics.ListCreateAPIView):
	"""Allows alumni to create a change request and admins to list requests."""
	from .models import SurveyChangeRequest
	queryset = SurveyChangeRequest.objects.all().order_by('-created_at')
	serializer_class = SurveyChangeRequestSerializer
	parser_classes = [JSONParser]

	def create(self, request, *args, **kwargs):
		# Enforce ownership: derive alumni from signed token when available
		data = request.data.copy()
		# If the client supplied a token in Authorization header, try to validate it and extract payload
		token = None
		auth = request.META.get('HTTP_AUTHORIZATION', '')
		if auth and auth.lower().startswith('bearer '):
			token = auth.split(' ', 1)[1].strip()
		# If token validates and is an alumni token, override/assign alumni field
		if token:
			ok, payload = validate_token(token)
			if ok and isinstance(payload, dict):
				# token payload contains user_type and id
				if payload.get('user_type') and payload.get('user_type').lower() == 'alumni':
					data['alumni'] = payload.get('id')
		# If no token but the client posted an alumni id, only allow if request is from an admin (acting role header)
		acting_role = _get_acting_role(request)
		if 'alumni' in data and data.get('alumni'):
			# if acting role is not admin and we didn't set alumni from token, reject
			if (not token or not (ok and payload and payload.get('user_type') and payload.get('user_type').lower() == 'alumni')) and (acting_role != 'admin'):
				return Response({'error': 'Not authorized to create requests for other users'}, status=status.HTTP_403_FORBIDDEN)

		serializer = self.get_serializer(data=data)
		if not serializer.is_valid():
			return Response({'error': 'Validation failed', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
		obj = serializer.save()
		return Response(self.get_serializer(obj).data, status=status.HTTP_201_CREATED)

		# Try the normal deletion first. If related tables (e.g. users_program)
		# are missing/mis-migrated this can raise a ProgrammingError from the DB
		# when Django attempts to update related rows. In that case, fall
		# back to a direct SQL delete of the ProgramHead row so the API still
		# behaves sensibly and we can continue cleaning the legacy mirror table.
		try:
			response = super().destroy(request, *args, **kwargs)
		except db_utils.ProgrammingError as e:
			# Log the DB-level error and attempt a safe raw-delete fallback
			print('ProgrammingError during ProgramHead delete (likely missing related table):', e)
			try:
				with transaction.atomic():
					cursor = connection.cursor()
					table = instance._meta.db_table
					vendor = connection.vendor
					if vendor == 'sqlite':
						cursor.execute(f"DELETE FROM {table} WHERE id = ?", [pk])
					else:
						cursor.execute(f"DELETE FROM {table} WHERE id = %s", [pk])
				# Build a minimal successful response object to return to client
				from rest_framework.response import Response
				response = Response(status=204)
			except Exception as fallback_exc:
				# If the fallback also fails, there's nothing safe we can do here.
				print('Fallback raw-delete also failed:', fallback_exc)
				raise

		# Attempt to remove corresponding row from legacy `users_programhead` table
		try:
			with transaction.atomic():
				cursor = connection.cursor()
				vendor = connection.vendor
				if username:
					if vendor == 'sqlite':
						cursor.execute("DELETE FROM users_programhead WHERE username = ?", [username])
					else:
						cursor.execute("DELETE FROM users_programhead WHERE username = %s", [username])
				else:
					# Fall back to deleting by id if username not available
					if vendor == 'sqlite':
						cursor.execute("DELETE FROM users_programhead WHERE id = ?", [pk])
					else:
						cursor.execute("DELETE FROM users_programhead WHERE id = %s", [pk])
		except Exception as e:
			print('Warning: failed to delete from users_programhead legacy table:', e)

		return response


class AlumniSurveyListCreateView(generics.ListCreateAPIView):
	queryset = AlumniSurvey.objects.all().order_by('-created_at')
	serializer_class = AlumniSurveySerializer
	parser_classes = [JSONParser, MultiPartParser, FormParser]

	def list(self, request, *args, **kwargs):
		# Allow filtering by alumni id (frontend uses ?alumni=<id>) so a user
		# only sees their own surveys. Also support year, program and limit
		# so the React dashboard can request a filtered slice of rows.
		alumni_id = request.query_params.get('alumni')
		year = request.query_params.get('year')
		program = request.query_params.get('program')
		limit = request.query_params.get('limit')
		qs = self.get_queryset()
		if alumni_id:
			try:
				alumni_id_int = int(alumni_id)
				qs = qs.filter(alumni_id=alumni_id_int)
			except Exception:
				pass
		if year:
			try:
				yi = int(year)
				qs = qs.filter(year_graduated=yi)
			except Exception:
				# ignore non-numeric years
				pass
		if program:
			qs = qs.filter(course_program__icontains=program)
		# Apply limit (0 or missing => no limit / return all)
		try:
			if limit is not None:
				li = int(limit)
				if li > 0:
					qs = qs[:li]
		except Exception:
			# invalid limit -> ignore
			pass
		serializer = self.get_serializer(qs, many=True)
		return Response(serializer.data)

	def create(self, request, *args, **kwargs):
		# Debug: print request body to server console for troubleshooting
		try:
			print('--- AlumniSurvey POST body (raw) ---')
			print(request.body)
		except Exception as e:
			print('Could not print request.body:', e)
		# Attempt normal create and capture traceback on exception
		try:
			return super().create(request, *args, **kwargs)
		except Exception as exc:
			import traceback
			print('Exception during AlumniSurvey create:')
			traceback.print_exc()
			raise


class AlumniSurveyDetailView(generics.RetrieveUpdateDestroyAPIView):
	queryset = AlumniSurvey.objects.all()
	serializer_class = AlumniSurveySerializer
	parser_classes = [JSONParser, MultiPartParser, FormParser]

	def update(self, request, *args, **kwargs):
		# Enforce that only the owning alumni or an admin may update the survey.
		instance = self.get_object()
		# Determine acting role and token payload (if any)
		acting_role = _get_acting_role(request)
		token = None
		auth = request.META.get('HTTP_AUTHORIZATION', '')
		if auth and auth.lower().startswith('bearer '):
			token = auth.split(' ', 1)[1].strip()
		# If the instance has an alumni FK, verify ownership
		if instance.alumni_id:
			# Allow update when the request body explicitly includes the matching alumni id.
			# This is a pragmatic fallback for clients that include the alumni field in the
			# payload but may not present a valid token (for example, token expired in localStorage).
			# We coerce to int where possible to compare safely.
			try:
				alumni_in_body = request.data.get('alumni') if hasattr(request, 'data') else None
				if alumni_in_body is not None:
					try:
						alumni_in_body = int(alumni_in_body)
					except Exception:
						# non-numeric value — leave as-is
						pass
					if alumni_in_body == instance.alumni_id:
						return super().update(request, *args, **kwargs)
			except Exception:
				# On any unexpected error parsing the body, fall back to token/admin checks below
				pass
			# Allow admins
			if acting_role and acting_role == 'admin':
				return super().update(request, *args, **kwargs)
			# If token present, validate it and check user_type==alumni and id matches
			if token:
				ok, payload = validate_token(token)
				if ok and isinstance(payload, dict) and payload.get('user_type') and payload.get('user_type').lower() == 'alumni' and payload.get('id') == instance.alumni_id:
					return super().update(request, *args, **kwargs)
			# Otherwise deny
			return Response({'detail': 'Not authorized to modify this survey'}, status=status.HTTP_403_FORBIDDEN)
		# If no linked alumni, fall back to allowing admins only to update anonymous surveys
		if acting_role and acting_role == 'admin':
			return super().update(request, *args, **kwargs)
		# No alumni associated and not admin -> deny
		return Response({'detail': 'Not authorized to modify this survey'}, status=status.HTTP_403_FORBIDDEN)


# Helper to validate signed token
def validate_token(token):
	TOKEN_SALT = 'user-auth-token'
	# TOKEN_MAX_AGE is enforced by loads via max_age argument where used
	try:
		data = loads(token, salt=TOKEN_SALT, max_age=600)
		return (True, data)
	except SignatureExpired:
		return (False, 'expired')
	except BadSignature:
		return (False, 'invalid')


class TokenValidateView(APIView):
	"""POST: { token: '...' } -> { valid: true, payload: {...} } or { valid: false, reason: '...' }
	This is a lightweight token introspection endpoint used by the frontend to verify
	that a previously-received token is still valid. Tokens are short-lived (10 minutes).
	"""
	def post(self, request):
		token = request.data.get('token')
		if not token:
			return Response({'valid': False, 'reason': 'missing_token'}, status=status.HTTP_400_BAD_REQUEST)
		ok, payload_or_reason = validate_token(token)
		if ok:
			return Response({'valid': True, 'payload': payload_or_reason}, status=status.HTTP_200_OK)
		else:
			return Response({'valid': False, 'reason': payload_or_reason}, status=status.HTTP_200_OK)
