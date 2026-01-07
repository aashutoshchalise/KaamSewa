from django.db import models
from django.conf import settings

class Service(models.Model):
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name