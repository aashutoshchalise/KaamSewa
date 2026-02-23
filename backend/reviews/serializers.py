from rest_framework import serializers
from .models import Review


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["rating", "comment"]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


class ReviewSerializer(serializers.ModelSerializer):
    worker_username = serializers.CharField(source="worker.username", read_only=True)
    client_username = serializers.CharField(source="client.username", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "booking",
            "worker",
            "worker_username",
            "client",
            "client_username",
            "rating",
            "comment",
            "created_at",
        ]