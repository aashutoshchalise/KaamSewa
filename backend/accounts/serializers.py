import re
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import WorkerProfile, ClientProfile, WorkerSkill, SupportMessage, Notification

User = get_user_model()


class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "phone",
            "role",
            "is_worker_approved",
            "is_staff",
            "khalti_number",
            "bank_account_number",
        )


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "phone",
            "khalti_number",
            "bank_account_number",
        )

    def validate_username(self, value):
        user = self.instance
        if User.objects.exclude(pk=user.pk).filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value


class RegisterClientSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password], min_length=8)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("username", "email", "phone", "password", "password2")

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not re.search(r"[0-9]", value):
            raise serializers.ValidationError("Password must contain at least one number.")
        if not re.search(r"[!@#$%^&*]", value):
            raise serializers.ValidationError(
                "Password must contain at least one special character (!@#$%^&*)."
            )
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")

        user = User.objects.create_user(
            password=password,
            role="CLIENT",
            is_active=True,
            **validated_data,
        )
        return user


class WorkerCreateByAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("username", "email", "phone", "password", "khalti_number", "bank_account_number")

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not re.search(r"[0-9]", value):
            raise serializers.ValidationError("Password must contain at least one number.")
        if not re.search(r"[!@#$%^&*]", value):
            raise serializers.ValidationError(
                "Password must contain at least one special character (!@#$%^&*)."
            )
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")

        user = User.objects.create_user(
            password=password,
            role="WORKER",
            is_worker_approved=False,
            **validated_data,
        )
        return user


class WorkerProfileSerializer(serializers.ModelSerializer):
    skills = serializers.PrimaryKeyRelatedField(
        queryset=WorkerSkill.objects.all(),
        many=True,
        required=False
    )

    class Meta:
        model = WorkerProfile
        fields = ("bio", "hourly_rate", "availability_status", "skills", "rating_avg", "rating_count")
        read_only_fields = ("rating_avg", "rating_count")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    phone = serializers.CharField(required=True, allow_blank=False)
    khalti_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    bank_account_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = [
            "username",
            "password",
            "confirm_password",
            "phone",
            "role",
            "khalti_number",
            "bank_account_number",
        ]

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def validate_role(self, value):
        allowed_roles = ["CLIENT", "WORKER"]
        if value not in allowed_roles:
            raise serializers.ValidationError("Invalid role.")
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not re.search(r"[0-9]", value):
            raise serializers.ValidationError("Password must contain at least one number.")
        if not re.search(r"[!@#$%^&*]", value):
            raise serializers.ValidationError(
                "Password must contain at least one special character (!@#$%^&*)."
            )
        return value

    def validate(self, attrs):
        role = attrs.get("role")
        khalti_number = attrs.get("khalti_number")
        bank_account_number = attrs.get("bank_account_number")

        if attrs.get("password") != attrs.get("confirm_password"):
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )

        if role == "WORKER":
            if not khalti_number:
                raise serializers.ValidationError(
                    {"khalti_number": "Khalti number is required for workers."}
                )
            if not bank_account_number:
                raise serializers.ValidationError(
                    {"bank_account_number": "Bank account number is required for workers."}
                )

        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        password = validated_data.pop("password")

        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user


class SupportMessageSerializer(serializers.ModelSerializer):
    client_username = serializers.CharField(source="client.username", read_only=True)

    class Meta:
        model = SupportMessage
        fields = [
            "id",
            "client",
            "client_username",
            "subject",
            "message",
            "admin_reply",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "client",
            "client_username",
            "admin_reply",
            "status",
            "created_at",
            "updated_at",
        ]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "title", "message", "is_read", "created_at"]