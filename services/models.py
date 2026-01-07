from django.db import models


class ServiceCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Service(models.Model):
    PRICING_UNIT_CHOICES = (
        ("HOUR", "Per Hour"),
        ("FIXED", "Fixed"),
    )

    name = models.CharField(max_length=120)
    category = models.ForeignKey(ServiceCategory, on_delete=models.PROTECT, related_name="services")
    description = models.TextField(blank=True)

    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    pricing_unit = models.CharField(max_length=10, choices=PRICING_UNIT_CHOICES, default="FIXED")

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("name", "category")

    def __str__(self):
        return f"{self.name} ({self.category.name})"