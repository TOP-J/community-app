from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Profile


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    fieldsets = UserAdmin.fieldsets + (("User Type", {"fields": ("user_type",)}),)
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("User Type", {"fields": ("user_type",)}),
    )
    list_display = ("username", "email", "user_type", "is_staff", "is_active")
    search_fields = ("username", "email")


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "rep", "community_badge")
