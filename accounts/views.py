from django.contrib.auth import get_user_model
from rest_framework import permissions, status
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Photo
from .serializers import (
    LoginSerializer,
    PhotoSerializer,
    PhotoUpdateSerializer,
    PhotoUploadSerializer,
    RegisterSerializer,
    UserSerializer,
)


User = get_user_model()


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                "message": "Inscription reussie.",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Connexion reussie.",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class ProtectedProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(
            {
                "message": "Acces autorise avec un token JWT valide.",
                "user": UserSerializer(request.user).data,
            },
            status=status.HTTP_200_OK,
        )


class PhotoListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        photos = Photo.objects.filter(owner=request.user)
        serializer = PhotoSerializer(photos, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        payload = request.data.copy()

        if hasattr(request.data, "getlist"):
            images = request.data.getlist("images")
            descriptions = request.data.getlist("descriptions")
            dates = request.data.getlist("dates")

            if images:
                payload.setlist("images", images)
            if descriptions:
                payload.setlist("descriptions", descriptions)
            if dates:
                payload.setlist("dates", dates)

        serializer = PhotoUploadSerializer(data=payload, context={"request": request})
        serializer.is_valid(raise_exception=True)
        photos = serializer.save()

        response_serializer = PhotoSerializer(
            photos,
            many=True,
            context={"request": request},
        )
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class PhotoDetailView(RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Photo.objects.filter(owner=self.request.user)

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return PhotoUpdateSerializer
        return PhotoSerializer

    def get_serializer_context(self):
        return {"request": self.request}

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        response_serializer = PhotoSerializer(
            instance,
            context=self.get_serializer_context(),
        )
        return Response(response_serializer.data, status=status.HTTP_200_OK)
