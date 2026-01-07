from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import WorkerProfile, ClientProfile

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES)

    class Meta:
        model = User
        fields = ("username", "email", "password", "password2", "role")

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match"})
        return attrs

    def create(self, validated_data):
        role = validated_data.pop("role")
        password = validated_data.pop("password")
        validated_data.pop("password2")

        # Create user
        user = User.objects.create(
            **validated_data,
            role=role
        )
        user.set_password(password)
        user.save()

        # Auto-create profile
        if role == "WORKER":
            WorkerProfile.objects.create(user=user)
        elif role == "CLIENT":
            ClientProfile.objects.create(user=user)

        return user