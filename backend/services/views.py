from rest_framework import generics, permissions
from accounts.permissions import IsAdmin
from .models import (
    Service,
    ServiceCategory,
    ServicePackage,
    ServicePackageItem,
)
from .serializers import (
    ServiceSerializer,
    ServiceCategorySerializer,
    ServicePackageSerializer,
    ServicePackageItemSerializer,
)


# =========================
# CATEGORY & SERVICE BROWSE
# =========================
class CategoryListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = ServiceCategory.objects.all().order_by("name")
    serializer_class = ServiceCategorySerializer


class ServiceListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = (
        Service.objects.filter(is_active=True)
        .select_related("category")
        .order_by("name")
    )
    serializer_class = ServiceSerializer


# =========================
# PACKAGE (USP)
# =========================
class PackageListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = ServicePackage.objects.filter(is_active=True).order_by("name")
    serializer_class = ServicePackageSerializer


class PackageDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = ServicePackage.objects.all()
    serializer_class = ServicePackageSerializer


# =========================
# ADMIN CREATE
# =========================
class CategoryCreateView(generics.CreateAPIView):
    permission_classes = [IsAdmin]
    queryset = ServiceCategory.objects.all()
    serializer_class = ServiceCategorySerializer


class ServiceCreateView(generics.CreateAPIView):
    permission_classes = [IsAdmin]
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer


class PackageCreateView(generics.CreateAPIView):
    permission_classes = [IsAdmin]
    queryset = ServicePackage.objects.all()
    serializer_class = ServicePackageSerializer


class PackageItemCreateView(generics.CreateAPIView):
    permission_classes = [IsAdmin]
    queryset = ServicePackageItem.objects.all()
    serializer_class = ServicePackageItemSerializer