from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .permissions import IsAdmin, IsWorker
from .serializers import (
    RegisterClientSerializer,
    WorkerCreateByAdminSerializer,
    MeSerializer,
    WorkerProfileSerializer,
)
from .models import WorkerProfile

User = get_user_model()


class RegisterClientView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterClientSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            "user": MeSerializer(user).data,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        })


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)


# ADMIN creates worker accounts
class AdminCreateWorkerView(generics.CreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = WorkerCreateByAdminSerializer


# ADMIN approves worker
class AdminApproveWorkerView(generics.UpdateAPIView):
    permission_classes = [IsAdmin]
    queryset = User.objects.filter(role="WORKER")
    lookup_url_kwarg = "user_id"

    def patch(self, request, *args, **kwargs):
        worker = self.get_object()
        worker.is_worker_approved = True
        worker.save(update_fields=["is_worker_approved"])
        return Response({"detail": "Worker approved", "worker": MeSerializer(worker).data})


# Worker updates profile
class WorkerProfileMeView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsWorker]
    serializer_class = WorkerProfileSerializer

    def get_object(self):
        return WorkerProfile.objects.get(user=self.request.user)