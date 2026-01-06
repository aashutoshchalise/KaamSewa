from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterClientView,
    LoginView,
    MeView,
    AdminCreateWorkerView,
    AdminApproveWorkerView,
    WorkerProfileMeView,
)

urlpatterns = [
    # Auth (client register only)
    path("auth/register/", RegisterClientView.as_view()),
    path("auth/login/", LoginView.as_view()),
    path("auth/refresh/", TokenRefreshView.as_view()),
    path("me/", MeView.as_view()),

    # Admin worker management
    path("admin/workers/create/", AdminCreateWorkerView.as_view()),
    path("admin/workers/<int:user_id>/approve/", AdminApproveWorkerView.as_view()),

    # Worker profile
    path("worker/profile/", WorkerProfileMeView.as_view()),
]