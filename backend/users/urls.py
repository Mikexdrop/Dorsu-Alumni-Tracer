from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from .views import (
    AdminListCreateView,
    AlumniListCreateView,
    ProgramHeadListCreateView,
    ProgramListCreateView,
    LoginView,
    AlumniConsentView,
    AdminDetailView,
    AlumniDetailView,
    ProgramHeadDetailView,
    AlumniSurveyListCreateView,
    AlumniSurveyDetailView,
    SurveyAggregatesView,
    SurveyChangeRequestListCreateView,
    AlumniChangePasswordView,
    TokenValidateView,
    NotificationListCreateView,
    NotificationDetailView,
)
urlpatterns = [
    path('admins/', AdminListCreateView.as_view(), name='admin-list-create'),
    path('alumni/', AlumniListCreateView.as_view(), name='alumni-list-create'),
    path('program-heads/', ProgramHeadListCreateView.as_view(), name='programhead-list-create'),
    path('admins/<int:pk>/', AdminDetailView.as_view(), name='admin-detail'),
    path('alumni/<int:pk>/', AlumniDetailView.as_view(), name='alumni-detail'),
    path('alumni/<int:pk>/change_password/', AlumniChangePasswordView.as_view(), name='alumni-change-password'),
    path('program-heads/<int:pk>/', ProgramHeadDetailView.as_view(), name='programhead-detail'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/validate/', TokenValidateView.as_view(), name='token-validate'),
    path('alumni/consent/', AlumniConsentView.as_view(), name='alumni-consent'),
    # Survey endpoints
    path('alumni-surveys/', csrf_exempt(AlumniSurveyListCreateView.as_view()), name='alumni-survey-list-create'),
    path('alumni-surveys/<int:pk>/', csrf_exempt(AlumniSurveyDetailView.as_view()), name='alumni-survey-detail'),
    path('survey-aggregates/', SurveyAggregatesView.as_view(), name='survey-aggregates'),
    # Notifications persisted server-side so multiple admin accounts see the same alerts
    path('notifications/', csrf_exempt(NotificationListCreateView.as_view()), name='notifications-list-create'),
    path('notifications/<int:pk>/', csrf_exempt(NotificationDetailView.as_view()), name='notifications-detail'),
    # Legacy/frontend-compatible alias used by the React app: /api/users_alumnisurvey/
    path('users_alumnisurvey/', csrf_exempt(AlumniSurveyListCreateView.as_view()), name='users-alumnisurvey-list'),
    path('survey-change-requests/', csrf_exempt(SurveyChangeRequestListCreateView.as_view()), name='survey-change-requests'),
    path('programs/', ProgramListCreateView.as_view(), name='program-list-create'),
]
