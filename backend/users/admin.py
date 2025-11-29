from django.contrib import admin
from .models import Program, ProgramHead, Alumni


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
	list_display = ('program_name', 'program_head', 'status', 'created_at')
	list_filter = ('status',)
	search_fields = ('program_name', 'program_head__username', 'program_head__email')


@admin.register(ProgramHead)
class ProgramHeadAdmin(admin.ModelAdmin):
	list_display = ('username', 'name', 'surname', 'email', 'status')
	list_filter = ('status',)
	search_fields = ('username', 'name', 'surname', 'email')


@admin.register(Alumni)
class AlumniAdmin(admin.ModelAdmin):
	list_display = ('username', 'email', 'full_name')
	search_fields = ('username', 'email', 'full_name')
