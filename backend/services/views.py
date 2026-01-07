from rest_framework import generics, permissions
from .models import Service, ServiceCategory
from .serializers import ServiceSerializer, ServiceCategorySerializer
from accounts.permissions import IsAdmin


# Public/authenticated browsing
class CategoryListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = ServiceCategory.objects.all().order_by("name")
    serializer_class = ServiceCategorySerializer


class ServiceListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Service.objects.filter(is_active=True).select_related("category").order_by("name")
    serializer_class = ServiceSerializer


# Admin CRUD
class CategoryCreateView(generics.CreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = ServiceCategorySerializer
    queryset = ServiceCategory.objects.all()


class ServiceCreateView(generics.CreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = ServiceSerializer
    queryset = Service.objects.all()