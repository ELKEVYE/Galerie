from django.contrib import admin

from .models import Photo


@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    list_display = ("id", "owner", "date", "created_at")
    search_fields = ("owner__username", "owner__email", "description")
    list_filter = ("date", "created_at")
