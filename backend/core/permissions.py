from rest_framework import permissions
from core.models import Conversation, Message

class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow administrators to access.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.user_type == 'admin'

class IsTeacherOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow teachers or administrators to access.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               (request.user.user_type == 'teacher' or request.user.user_type == 'admin')

class IsStudent(permissions.BasePermission):
    """
    Custom permission to only allow students to access.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.user_type == 'student'

class IsOwnerOrAdminOrTeacher(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object, or admin/teacher users, to edit/delete it.
    Assumes the model instance has an 'author' or 'sender' or 'teacher' field.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Write permissions are only allowed to the owner of the snippet.
        # Check for common owner fields: 'author', 'sender', 'teacher', 'admin', 'student', 'reviewer'
        # This needs to be adapted based on the specific model field that links to the user.
        is_owner = False
        if hasattr(obj, 'author') and obj.author == request.user:
            is_owner = True
        elif hasattr(obj, 'sender') and obj.sender == request.user:
            is_owner = True
        elif hasattr(obj, 'teacher') and obj.teacher == request.user:
            is_owner = True
        elif hasattr(obj, 'admin') and obj.admin == request.user:
            is_owner = True
        elif hasattr(obj, 'student') and obj.student == request.user: # For KnowledgeHubFeedback
            is_owner = True
        elif hasattr(obj, 'reviewer') and obj.reviewer == request.user: # For PeerReview
            is_owner = True


        is_admin = request.user.user_type == 'admin'
        is_teacher = request.user.user_type == 'teacher'

        # Allow owner, or admin, or teacher (for certain resources)
        # You might refine this further per model (e.g., teachers can't delete student comments)
        return is_owner or is_admin or is_teacher # Teachers can manage some content

class IsSpaceMember(permissions.BasePermission):
    """
    Custom permission to only allow users who are members of a specific space.
    This permission needs to be applied in views where the object (e.g., Post, Question)
    is associated with a Space.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Check if the user is a member of the space associated with the object
        if hasattr(obj, 'space') and obj.space:
            return obj.space.memberships.filter(user=request.user).exists()
        # If the object is not space-specific (e.g., global post), allow access
        return True

class IsConversationParticipant(permissions.BasePermission):
    """
    Custom permission to only allow users who are participants in a conversation.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Check if the user is a participant in the conversation
        if isinstance(obj, Conversation):
            return obj.participants.filter(id=request.user.id).exists()
        elif isinstance(obj, Message):
            return obj.conversation.participants.filter(id=request.user.id).exists()
        return False # Should not happen if applied correctly