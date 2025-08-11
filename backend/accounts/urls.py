from django.contrib import admin
from django.urls import path, include
from . import views
from .views import ProfileDetailView

urlpatterns = [
     # Djoser URLs for user registration, login, password reset, etc.
    path('accounts/', include('djoser.urls')), # /users/ and /users/me/
    path('auth/', include('djoser.urls.authtoken')), # /token/login/ and /token/logout/

    # Custom Profile API
    path('profile/me/', ProfileDetailView.as_view(), name='profile-me'),
]