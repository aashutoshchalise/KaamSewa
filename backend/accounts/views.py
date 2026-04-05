from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import ProfileUpdateSerializer
from rest_framework.permissions import IsAuthenticated
from .models import SupportMessage
from .serializers import SupportMessageSerializer
from .models import Notification
from .serializers import NotificationSerializer


from .permissions import IsAdmin, IsWorker
from .serializers import (
    RegisterClientSerializer,
    WorkerCreateByAdminSerializer,
    MeSerializer,
    WorkerProfileSerializer,
)
from .models import WorkerProfile
from rest_framework import status
from .serializers import RegisterSerializer

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


class RegisterView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "User registered successfully."},
            status=status.HTTP_201_CREATED,
        )


class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = ProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(MeSerializer(request.user).data)

class CreateSupportMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SupportMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        support_message = SupportMessage.objects.create(
            client=request.user,
            subject=serializer.validated_data["subject"],
            message=serializer.validated_data["message"],
        )
        return Response(SupportMessageSerializer(support_message).data, status=201)


class MySupportMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = SupportMessage.objects.filter(client=request.user).order_by("-created_at")
        return Response(SupportMessageSerializer(qs, many=True).data)


class MyNotificationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Notification.objects.filter(user=request.user)
        return Response(NotificationSerializer(qs, many=True).data)


class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        notification = Notification.objects.filter(
            id=notification_id,
            user=request.user
        ).first()

        if not notification:
            return Response({"detail": "Notification not found."}, status=404)

        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response({"detail": "Notification marked as read."})