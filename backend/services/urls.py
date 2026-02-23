from django.urls import path
from .views import (
    CategoryListView,
    ServiceListView,
    ServiceDetailView,
    CategoryCreateView,
    ServiceCreateView,
    PackageListView,
    PackageDetailView,
    PackageCreateView,
    PackageItemCreateView,
)

urlpatterns = [
    # browse
    path("categories/", CategoryListView.as_view()),
    path("", ServiceListView.as_view()),
    path("<int:pk>/", ServiceDetailView.as_view()),  # ✅ ADD THIS

    # packages
    path("packages/", PackageListView.as_view()),
    path("packages/<int:pk>/", PackageDetailView.as_view()),

    # admin create
    path("admin/categories/create/", CategoryCreateView.as_view()),
    path("admin/create/", ServiceCreateView.as_view()),
    path("admin/packages/create/", PackageCreateView.as_view()),
    path("admin/packages/items/create/", PackageItemCreateView.as_view()),
]