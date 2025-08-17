# accounts/models.py

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


# Custom User Manager
class CustomUserManager(BaseUserManager):
    def create_user(self, username, email=None, password=None, **extra_fields):
        if not username:
            raise ValueError("The Username field is required")
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("user_type", "admin")
        return self.create_user(username, email, password, **extra_fields)


# Custom User model
class CustomUser(AbstractUser):
    USER_TYPE_CHOICES = (
        ("student", "Student"),
        ("teacher", "Teacher"),
        ("admin", "Administrator"),
    )
    user_type = models.CharField(
        max_length=10, choices=USER_TYPE_CHOICES, default="student"
    )
    objects = CustomUserManager()

    def __str__(self):
        return self.username


# Profile model with rep and community badge
class Profile(models.Model):
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name="profile"
    )
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(
        upload_to="profile_pics/", blank=True, null=True
    )
    date_of_birth = models.DateField(blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    rep = models.IntegerField(default=0, help_text="Reputation points")
    school_name = models.CharField(
        max_length=100, blank=True, null=True, help_text="School or institution name"
    )
    community_badge = models.CharField(
        max_length=50, blank=True, null=True, default=None, help_text="Community badge"
    )
    gender = models.CharField(
        max_length=10,
        choices=[("male", "Male"), ("female", "Female")],
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"{self.user.username}'s profile"

    def save(self, *args, **kwargs):
        # Auto-assign badge before every save
        if self.rep >= 500:
            self.community_badge = "Leader"
        elif self.rep >= 200:
            self.community_badge = "Mentor"
        elif self.rep >= 50:
            self.community_badge = "Contributor"
        else:
            self.community_badge = None
        super().save(*args, **kwargs)


# Auto-create profile when user is created
@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
