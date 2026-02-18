from django.db import models
from django.core.validators import MinValueValidator


# =========================
# CATEGORY
# =========================
class ServiceCategory(models.Model):
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


# =========================
# SERVICE (single service)
# =========================
class Service(models.Model):
    PRICING_UNIT_CHOICES = [
        ("HOUR", "Per Hour"),
        ("FIXED", "Fixed Price"),
    ]

    name = models.CharField(max_length=120)
    category = models.ForeignKey(
        ServiceCategory,
        on_delete=models.CASCADE,
        related_name="services",
    )
    description = models.TextField(blank=True)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    pricing_unit = models.CharField(max_length=10, choices=PRICING_UNIT_CHOICES)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# =========================
# PACKAGE (USP)
# =========================
class ServicePackage(models.Model):
    """
    A package is a bundle of services (e.g., "Basic Plumbing Package")
    """
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    @property
    def total_base_price(self):
        return sum(
            (item.service.base_price * item.quantity)
            for item in self.items.select_related("service").all()
        )


# =========================
# PACKAGE ITEMS
# =========================
class ServicePackageItem(models.Model):
    package = models.ForeignKey(
        ServicePackage,
        on_delete=models.CASCADE,
        related_name="items",
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.PROTECT,
        related_name="package_items",
    )
    quantity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
    )

    class Meta:
        unique_together = ("package", "service")

    def __str__(self):
        return f"{self.package.name} -> {self.service.name} x {self.quantity}"