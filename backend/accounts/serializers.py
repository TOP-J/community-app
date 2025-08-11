#accounts/serializers.py
from rest_framework import serializers
from .models import CustomUser, Profile

class AbsoluteImageField(serializers.ImageField):
    def to_representation(self, value):
        if not value:
            return ''
        request = self.context.get('request', None)
        url = super().to_representation(value)
        return request.build_absolute_uri(url) if request else url

# ----------------------------------------
# Profile nested serializer (used in other serializers)
# ----------------------------------------
class ProfileNestedSerializer(serializers.ModelSerializer):
    profile_picture = AbsoluteImageField()
    class Meta:
        model = Profile
        fields = ['profile_picture', 'rep', 'school_name', 'gender']


# ----------------------------------------
# Secure user registration
# ----------------------------------------
class UserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'password', 'user_type')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user


# ----------------------------------------
# Full user detail serializer
# ----------------------------------------
class UserSerializer(serializers.ModelSerializer):
    profile = ProfileNestedSerializer(read_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'user_type',
            'first_name', 'last_name', 'profile'
        )


# ----------------------------------------
# Simple nested user serializer (used in posts/comments)
# ----------------------------------------
class SimpleUserSerializer(serializers.ModelSerializer):
    profile = ProfileNestedSerializer(read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'profile']


# ----------------------------------------
# Profile serializer with full detail and update logic
# ----------------------------------------
class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Profile
        fields = (
            'id', 'user', 'bio', 'profile_picture',
            'date_of_birth', 'phone_number', 'rep', 'community_badge'
        )
        read_only_fields = ('user', 'community_badge')

    def update(self, instance, validated_data):
        for field in ['bio', 'profile_picture', 'date_of_birth', 'phone_number', 'rep']:
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        instance.save()
        if 'rep' in validated_data:
            instance.assign_badge()
        return instance

class TopContributorSerializer(serializers.ModelSerializer):
    profile_picture = AbsoluteImageField(source='profile.profile_picture')
    rep = serializers.IntegerField(source='profile.rep')
    community_badge = serializers.CharField(source='profile.community_badge', allow_null=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'profile_picture', 'rep', 'community_badge']