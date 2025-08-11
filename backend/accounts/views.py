# accounts/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Profile
from .serializers import ProfileSerializer

class ProfileDetailView(generics.RetrieveUpdateAPIView):
    """
    API endpoint for retrieving and updating the user's own profile.
    """
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated] # Only authenticated users can access their profile

    def get_object(self):
        """
        Ensures a user can only access/update their own profile.
        """
        return self.request.user.profile

    def perform_update(self, serializer):
        # When updating, ensure the user field isn't accidentally changed
        serializer.save(user=self.request.user)