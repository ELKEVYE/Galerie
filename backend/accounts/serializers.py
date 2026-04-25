from typing import Any

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Photo


User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("username", "email", "password", "password_confirm")

    def validate_username(self, value: str) -> str:
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est deja utilise.")
        return value

    def validate_email(self, value: str) -> str:
        normalized_email = value.strip().lower()
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("Cet email est deja utilise.")
        return normalized_email

    def validate(self, attrs: dict) -> dict:
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "La confirmation du mot de passe ne correspond pas."}
            )
        validate_password(attrs["password"])
        return attrs

    def create(self, validated_data: dict) -> Any:
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(
        help_text="Nom d'utilisateur ou adresse email."
    )
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs: dict) -> dict:
        identifier = attrs.get("identifier", "").strip()
        password = attrs.get("password")

        if not identifier or not password:
            raise serializers.ValidationError(
                "Le nom d'utilisateur/email et le mot de passe sont obligatoires."
            )

        username = identifier
        if "@" in identifier:
            user = User.objects.filter(email__iexact=identifier).first()
            if user:
                username = user.get_username()

        user = authenticate(
            request=self.context.get("request"),
            username=username,
            password=password,
        )
        if not user:
            raise serializers.ValidationError(
                "Identifiants invalides.", code="authorization"
            )
        if not user.is_active:
            raise serializers.ValidationError("Ce compte est desactive.")

        attrs["user"] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email")


class PhotoSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Photo
        fields = ["id", "image", "image_url", "description", "date"]

    def get_image_url(self, obj: Photo) -> str:
        if not obj.image:
            return ""

        backend_url = getattr(settings, "BACKEND_URL", "").rstrip("/")

        if backend_url:
            return f"{backend_url}{obj.image.url}"

        request = self.context.get("request")
        if request is None:
            return obj.image.url

        return request.build_absolute_uri(obj.image.url)


class PhotoUploadSerializer(serializers.Serializer):
    images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False,
        allow_empty=False,
    )
    image = serializers.ImageField(write_only=True, required=False)
    descriptions = serializers.ListField(
        child=serializers.CharField(allow_blank=True),
        write_only=True,
        required=False,
    )
    dates = serializers.ListField(
        child=serializers.DateField(),
        write_only=True,
        required=False,
    )

    def validate(self, attrs: dict) -> dict:
        images = attrs.get("images") or []
        single_image = attrs.get("image")

        if single_image is not None:
            images = [single_image, *images]

        if not images:
            raise serializers.ValidationError(
                {"images": "Veuillez envoyer au moins une image."}
            )

        descriptions = attrs.get("descriptions") or []
        dates = attrs.get("dates") or []

        if descriptions and len(descriptions) != len(images):
            raise serializers.ValidationError(
                {
                    "descriptions": (
                        "Le nombre de descriptions doit correspondre au nombre d'images."
                    )
                }
            )

        if dates and len(dates) != len(images):
            raise serializers.ValidationError(
                {"dates": "Le nombre de dates doit correspondre au nombre d'images."}
            )

        if not dates:
            raise serializers.ValidationError(
                {"dates": "Une date est obligatoire pour chaque image."}
            )

        attrs["images"] = images
        attrs["descriptions"] = descriptions
        attrs["dates"] = dates
        return attrs

    def create(self, validated_data: dict) -> list[Photo]:
        request = self.context["request"]
        images = validated_data["images"]
        descriptions = validated_data.get("descriptions") or [""] * len(images)
        dates = validated_data["dates"]

        photos = []
        for index, image in enumerate(images):
            photos.append(
                Photo.objects.create(
                    owner=request.user,
                    image=image,
                    description=descriptions[index],
                    date=dates[index],
                )
            )
        return photos


class PhotoUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Photo
        fields = ("image", "description", "date")
