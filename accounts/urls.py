from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    PhotoDetailView,
    PhotoListCreateView,
    ProtectedProfileView,
    RegisterView,
)


urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", ProtectedProfileView.as_view(), name="protected_profile"),
    path("photos/", PhotoListCreateView.as_view(), name="photo_list_create"),
    path("photos/<int:pk>/", PhotoDetailView.as_view(), name="photo_detail"),
]
