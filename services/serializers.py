from rest_framework import serializers
from .models import Service, ServiceCategory


class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = ("id", "name")


class ServiceSerializer(serializers.ModelSerializer):
    category_detail = ServiceCategorySerializer(source="category", read_only=True)

    class Meta:
        model = Service
        fields = (
            "id",
            "name",
            "category",
            "category_detail",
            "description",
            "base_price",
            "pricing_unit",
            "is_active",
            "created_at",
        )
        read_only_fields = ("created_at",)