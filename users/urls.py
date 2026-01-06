from django.urls import include, path
from .views import RegisterView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path('api/users/', include('users.urls')),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]