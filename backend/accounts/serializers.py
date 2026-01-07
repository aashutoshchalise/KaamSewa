from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import WorkerProfile, ClientProfile, WorkerSkill

User = get_user_model()


class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "phone", "role", "is_worker_approved", "is_staff")


class RegisterClientSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("username", "email", "phone", "password", "password2")

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match"})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")

        user = User.objects.create(
            **validated_data,
            role="CLIENT",
            is_active=True,
        )
        user.set_password(password)
        user.save()

        ClientProfile.objects.create(user=user)
        return user


class WorkerCreateByAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("username", "email", "phone", "password")

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create(**validated_data, role="WORKER", is_worker_approved=False)
        user.set_password(password)
        user.save()
        WorkerProfile.objects.create(user=user)
        return user


class WorkerProfileSerializer(serializers.ModelSerializer):
    skills = serializers.PrimaryKeyRelatedField(queryset=WorkerSkill.objects.all(), many=True, required=False)

    class Meta:
        model = WorkerProfile
        fields = ("bio", "hourly_rate", "availability_status", "skills", "rating_avg", "rating_count")
        read_only_fields = ("rating_avg", "rating_count")