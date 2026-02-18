from rest_framework import serializers
from .models import (
    Service,
    ServiceCategory,
    ServicePackage,
    ServicePackageItem,
)


# =========================
# CATEGORY
# =========================
class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = "__all__"


# =========================
# SERVICE
# =========================
class ServiceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Service
        fields = [
            "id",
            "name",
            "category",
            "category_name",
            "description",
            "base_price",
            "pricing_unit",
            "is_active",
            "created_at",
        ]


# =========================
# PACKAGE ITEM
# =========================
class ServicePackageItemSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="service.name", read_only=True)
    service_base_price = serializers.DecimalField(
        source="service.base_price",
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = ServicePackageItem
        fields = [
            "id",
            "package",
            "service",
            "service_name",
            "service_base_price",
            "quantity",
        ]


# =========================
# PACKAGE
# =========================
class ServicePackageSerializer(serializers.ModelSerializer):
    items = ServicePackageItemSerializer(many=True, read_only=True)
    total_base_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = ServicePackage
        fields = [
            "id",
            "name",
            "description",
            "is_active",
            "created_at",
            "items",
            "total_base_price",
        ]