from django.urls import path
from .views import (
    CategoryListView,
    ServiceListView,
    CategoryCreateView,
    ServiceCreateView,
)

urlpatterns = [
    # browse
    path("categories/", CategoryListView.as_view()),
    path("", ServiceListView.as_view()),

    # admin create
    path("admin/categories/create/", CategoryCreateView.as_view()),
    path("admin/create/", ServiceCreateView.as_view()),
]