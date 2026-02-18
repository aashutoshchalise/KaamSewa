from django.urls import path
from .views import (
    CategoryListView,
    ServiceListView,
    CategoryCreateView,
    ServiceCreateView,
    PackageListView,
    PackageDetailView,
    PackageCreateView,
    PackageItemCreateView,
)

urlpatterns = [
    # =====================
    # Browse
    # =====================
    path("categories/", CategoryListView.as_view()),
    path("", ServiceListView.as_view()),

    # =====================
    # Packages (USP)
    # =====================
    path("packages/", PackageListView.as_view()),
    path("packages/<int:pk>/", PackageDetailView.as_view()),

    # =====================
    # Admin Create
    # =====================
    path("admin/categories/create/", CategoryCreateView.as_view()),
    path("admin/create/", ServiceCreateView.as_view()),
    path("admin/packages/create/", PackageCreateView.as_view()),
    path("admin/packages/items/create/", PackageItemCreateView.as_view()),
]