from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView,
    MeView,
    AdminCreateWorkerView,
    AdminApproveWorkerView,
    WorkerProfileMeView,
    RegisterView,
    ProfileUpdateView,
)

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view()),
    path("auth/refresh/", TokenRefreshView.as_view()),
    path("auth/me/", MeView.as_view()),
    path("auth/me/update/", ProfileUpdateView.as_view(), name="me-update"),

    path("admin/workers/create/", AdminCreateWorkerView.as_view()),
    path("admin/workers/<int:user_id>/approve/", AdminApproveWorkerView.as_view()),

    path("worker/profile/", WorkerProfileMeView.as_view()),
]