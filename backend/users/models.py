
from django.db import models

class Admin(models.Model):
	username = models.CharField(max_length=150, unique=True)
	email = models.EmailField(unique=True)
	password = models.CharField(max_length=128)
	full_name = models.CharField(max_length=255)

	# Optional profile image for admin users
	image = models.ImageField(upload_to='admin_images/', null=True, blank=True)
	def __str__(self):
		return self.username

class Alumni(models.Model):
	username = models.CharField(max_length=150, unique=True)
	email = models.EmailField(unique=True)
	password = models.CharField(max_length=128)
	full_name = models.CharField(max_length=255)

	# Program or course the alumni studied
	program_course = models.CharField(max_length=255, blank=True)
	# Profile image
	image = models.ImageField(upload_to='alumni_images/', null=True, blank=True)
	# Year graduated (store as small positive integer). Make nullable for safe migrations;
	# serializer will enforce presence on create/update.
	year_graduated = models.PositiveSmallIntegerField(null=True, blank=True)

	# Verification: alumni can upload a proof image and await admin approval
	def __str__(self):
		return self.username

class ProgramHead(models.Model):
	username = models.CharField(max_length=150, unique=True)
	name = models.CharField(max_length=255)
	surname = models.CharField(max_length=255)
	mi = models.CharField(max_length=1, blank=True)
	gender = models.CharField(max_length=10)
	contact = models.CharField(max_length=20)
	email = models.EmailField(unique=True)
	faculty = models.CharField(max_length=100)
	program = models.CharField(max_length=100)
	# Optional profile image for program heads
	image = models.ImageField(upload_to='programhead_images/', null=True, blank=True)
	# Approval status: pending | approved | rejected
	status = models.CharField(max_length=20, default='pending')
	password = models.CharField(max_length=128)
	def __str__(self):
		return self.username


# Mirror table used by MySQL Workbench for external integration / legacy scripts.
# Note: We removed the duplicate UsersProgramHead model that previously
# declared `db_table = 'users_programhead'`. The existing `ProgramHead`
# model is the authoritative model for program head users and already
# maps to the legacy table (or will be migrated by Django). Keeping two
# models with the same db_table triggers Django system check errors.
# If you need a separate read-only mirror model for external tools,
# consider using a database view or configure a single model with the
# correct db_table and access it from MySQL Workbench.


# Survey models
class AlumniSurvey(models.Model):
	# optional link to an Alumni user if available
	alumni = models.ForeignKey('Alumni', null=True, blank=True, on_delete=models.SET_NULL, related_name='surveys')
	last_name = models.CharField(max_length=255)
	first_name = models.CharField(max_length=255)
	middle_name = models.CharField(max_length=255, blank=True)
	year_graduated = models.CharField(max_length=8, blank=True)
	course_program = models.CharField(max_length=255, blank=True)
	student_number = models.CharField(max_length=100, blank=True)
	birth_year = models.CharField(max_length=6, blank=True)
	birth_month = models.CharField(max_length=16, blank=True)
	birth_day = models.CharField(max_length=4, blank=True)
	age = models.PositiveIntegerField(null=True, blank=True)
	gender = models.CharField(max_length=20, blank=True)
	home_address = models.TextField(blank=True)
	telephone_number = models.CharField(max_length=50, blank=True)
	mobile_number = models.CharField(max_length=50, blank=True)
	email = models.EmailField(blank=True)
	current_job_position = models.CharField(max_length=255, blank=True)
	company_affiliation = models.CharField(max_length=255, blank=True)
	company_address = models.TextField(blank=True)
	approximate_monthly_salary = models.CharField(max_length=64, blank=True)
	employed_after_graduation = models.CharField(max_length=16, blank=True)
	# store simple lists / structured small data
	job_difficulties = models.JSONField(default=list, blank=True)
	employment_source = models.CharField(max_length=255, blank=True)
	jobs_related_to_experience = models.CharField(max_length=16, blank=True)
	improvement_suggestions = models.TextField(blank=True)
	has_been_promoted = models.CharField(max_length=16, blank=True)
	work_performance_rating = models.CharField(max_length=64, blank=True)
	# whether the respondent has their own business ('yes' or 'no')
	has_own_business = models.CharField(max_length=3, null=True, blank=True, choices=[('yes','yes'), ('no','no')])
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"Survey {self.id} - {self.last_name}, {self.first_name}"


class EmploymentRecord(models.Model):
	survey = models.ForeignKey(AlumniSurvey, related_name='employment_records', on_delete=models.CASCADE)
	company_name = models.CharField(max_length=255, blank=True)
	date_employed = models.CharField(max_length=32, blank=True)
	position_and_status = models.CharField(max_length=255, blank=True)
	monthly_salary_range = models.CharField(max_length=64, blank=True)

	def __str__(self):
		return f"{self.company_name} ({self.survey_id})"


class SurveyChangeRequest(models.Model):
	alumni = models.ForeignKey('Alumni', null=True, blank=True, on_delete=models.SET_NULL, related_name='survey_change_requests')
	message = models.TextField()
	status = models.CharField(max_length=32, default='pending')  # pending, reviewed, actioned
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"SurveyChangeRequest {self.id} - {self.alumni_id} - {self.status}"
class Program(models.Model):
	program_name = models.CharField(max_length=255)
	program_head = models.ForeignKey(
		'ProgramHead',
		on_delete=models.SET_NULL,
		null=True,
		related_name='assigned_programs',
		db_column='program_head_id'
	)
	faculty = models.CharField(max_length=100)
	status = models.CharField(max_length=20, default='active')
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		db_table = 'users_program'
		ordering = ['program_name']

	def __str__(self):
		return self.program_name


class Notification(models.Model):
	"""Simple global notification model.

	Notifications are stored centrally so all admin users can see them.
	Read-status is handled client-side in this project for simplicity; if you
	want per-admin read tracking, add a through/model to record reads per-user.
	"""
	title = models.CharField(max_length=255)
	message = models.TextField(blank=True)
	# optional structured payload (stored as JSON)
	payload = models.JSONField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-created_at']

	def __str__(self):
		return f"Notification {self.id} - {self.title}"


# Keep SelfEmployment as a separate model (already defined above) — nothing else to add here.
