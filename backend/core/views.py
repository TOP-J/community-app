from django.shortcuts import render

# Create your views here.

from rest_framework import viewsets, generics, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import (
    IsAuthenticated,
    AllowAny,
)  # DRF default permissions
from rest_framework import permissions

from django.db.models import Q, Count  # For complex queries
from accounts.models import CustomUser
from .models import (
    Space,
    SpaceMembership,
    FeedPost,
    Comment,
    Question,
    Answer,
    KnowledgeHub,
    KnowledgeHubFeedback,
    PeerReview,
    Conversation,
    ConversationParticipant,
    Message,
    FeedPostShare,
)
from .serializers import (
    SpaceSerializer,
    SpaceMembershipSerializer,
    FeedPostSerializer,
    CommentSerializer,
    QuestionSerializer,
    AnswerSerializer,
    KnowledgeHubSerializer,
    KnowledgeHubFeedbackSerializer,
    PeerReviewSerializer,
    ConversationSerializer,
    MessageSerializer,
    ConversationParticipantSerializer,
    AnswerSerializer,
    SimpleUserSerializer,
)
from .permissions import (
    IsAdminUser,
    IsTeacherOrAdmin,
    IsStudent,
    IsOwnerOrAdminOrTeacher,
    IsSpaceMember,
    IsConversationParticipant,
)
from accounts.serializers import TopContributorSerializer


# --- Space Views ---


class SpaceViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows spaces to be viewed or edited.
    - List: All authenticated users.
    - Create: Only Admin users.
    - Retrieve: All authenticated users.
    - Update/Delete: Only the creating Admin or another Admin.
    """

    queryset = Space.objects.all()
    serializer_class = SpaceSerializer
    permission_classes = [IsAuthenticated]  # Default

    def get_permissions(self):
        if self.action in ["create"]:
            self.permission_classes = [IsAdminUser]
        elif self.action in ["update", "partial_update", "destroy"]:
            self.permission_classes = [IsAdminUser]
        elif self.action in ["list", "retrieve"]:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(admin=self.request.user)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def my_space(self, request):
        """
        Get the space the current user is a member of.
        (Assumes only 1 space per user)
        """
        try:
            membership = SpaceMembership.objects.get(user=request.user)
            serializer = self.get_serializer(membership.space)
            return Response(serializer.data)
        except SpaceMembership.DoesNotExist:
            return Response(
                {"detail": "User is not a member of any space."},
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def joined(self, request):
        """
        List all spaces the current user is a member of.
        (Supports multiple memberships if allowed by model)
        """
        memberships = SpaceMembership.objects.filter(user=request.user)
        spaces = [membership.space for membership in memberships]
        serializer = self.get_serializer(spaces, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def join(self, request, pk=None):
        """
        Join a space (only one membership allowed).
        """
        space = self.get_object()
        user = request.user

        if SpaceMembership.objects.filter(user=user).exists():
            return Response(
                {
                    "detail": "You are already a member of a space. You can only join 1 space."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.user_type not in ["student", "teacher"]:
            return Response(
                {"detail": "Only students and teachers can join spaces."},
                status=status.HTTP_403_FORBIDDEN,
            )

        SpaceMembership.objects.create(user=user, space=space)
        return Response(
            {"detail": f"Successfully joined space: {space.name}"},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def leave(self, request, pk=None):
        """
        Leave a space.
        """
        space = self.get_object()
        user = request.user

        try:
            membership = SpaceMembership.objects.get(user=user, space=space)
            membership.delete()
            return Response(
                {"detail": f"Successfully left space: {space.name}"},
                status=status.HTTP_200_OK,
            )
        except SpaceMembership.DoesNotExist:
            return Response(
                {"detail": "You are not a member of this space."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["get"])
    def questions(self, request, pk=None):
        """
        Returns a list of all questions associated with a specific space.
        """
        space = self.get_object()
        questions = Question.objects.filter(space=space)
        serializer = QuestionSerializer(questions, many=True)
        return Response({"questions": serializer.data}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def posts(self, request, pk=None):
        """
        Returns a list of all feed posts associated with a specific space.
        """
        space = self.get_object()
        posts = FeedPost.objects.filter(space=space)
        serializer = FeedPostSerializer(posts, many=True)
        return Response({"posts": serializer.data}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def top_contributors(self, request, pk=None):
        """
        Return the top 3 contributors of a given space based on rep.
        """
        try:
            space = self.get_object()
        except Space.DoesNotExist:
            return Response(
                {"detail": "Space not found"}, status=status.HTTP_404_NOT_FOUND
            )

        members = (
            SpaceMembership.objects.filter(space=space)
            .select_related("user__profile")
            .order_by("-user__profile__rep")[:3]
        )

        users = [m.user for m in members]
        serializer = TopContributorSerializer(
            users, many=True, context={"request": request}
        )

        return Response(
            {
                "space_id": space.id,
                "space_name": space.name,
                "total_members": space.memberships.count(),
                "contributors": serializer.data,
            }
        )


# --- Feed Post Views ---


class FeedPostViewSet(viewsets.ModelViewSet):
    queryset = FeedPost.objects.all().order_by("-created_at")
    serializer_class = FeedPostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def get_queryset(self):
        return FeedPost.objects.all().order_by("-created_at")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request  # ✅ this makes profile_picture URLs absolute
        return context

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def toggle_like(self, request, pk=None):
        post = self.get_object()
        user = request.user
        like, created = FeedPostLike.objects.get_or_create(user=user, post=post)
        if not created:
            like.delete()
            post.author.profile.rep = max(post.author.profile.rep - 5, 0)
            post.author.profile.save()
            return Response({"liked": False})
        post.author.profile.rep += 5
        post.author.profile.save()
        return Response({"liked": True})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def toggle_share(self, request, pk=None):
        post = self.get_object()
        user = request.user
        already_shared = FeedPostShare.objects.filter(user=user, post=post).exists()
        if already_shared:
            return Response(
                {"shared": False}
            )  # sharing again is allowed but not counted
        FeedPostShare.objects.create(user=user, post=post)
        return Response({"shared": True})


@action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
def raise_concern(self, request, pk=None):
    print(f"Raise concern called for post {pk} by user {request.user}")
    post = self.get_object()
    sender = request.user
    message = f'{sender.username} raised a concern about the post: "{post.title}"'

    # Start with all superusers
    recipients = CustomUser.objects.filter(is_superuser=True)

    # If post belongs to a space, add teachers of that space
    if post.space:
        teachers = CustomUser.objects.filter(
            id__in=post.space.memberships.filter(
                user__profile__user_type="teacher"
            ).values_list("user_id", flat=True)
        )
        recipients = recipients.union(teachers)

    # Send personal message to each recipient
    for user in recipients.distinct():
        convo = (
            Conversation.objects.filter(is_group_chat=False, participants=request.user)
            .filter(participants=user)
            .first()
        )

        if not convo:
            convo = Conversation.objects.create(is_group_chat=False)
            convo.participants.add(request.user, user)

        Message.objects.create(sender=request.user, conversation=convo, content=message)
    return Response({"detail": "Concern raised and sent to moderators."}, status=201)

    @action(detail=True, methods=["get", "post"], permission_classes=[IsAuthenticated])
    def comments(self, request, pk=None):
        post = self.get_object()
        if request.method == "GET":
            comments = post.comments.all().order_by("-created_at")
            serializer = CommentSerializer(
                comments, many=True, context={"request": request}
            )
            return Response(serializer.data)
        if request.method == "POST":
            serializer = CommentSerializer(
                data=request.data, context={"request": request}
            )
            if serializer.is_valid():
                serializer.save(author=request.user, post=post)
                return Response(serializer.data, status=201)
            return Response(serializer.errors, status=400)


# --- Comment Views ---


class CommentViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows comments to be viewed or edited.
    - List: All authenticated users (can filter by post).
    - Create: All authenticated users.
    - Update/Delete: Only the author or Admin/Teacher.
    """

    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["update", "partial_update", "destroy"]:
            self.permission_classes = [
                IsOwnerOrAdminOrTeacher
            ]  # Owner can edit/delete, Admin/Teacher can delete
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        post_id = self.request.query_params.get("post_id")
        if post_id:
            queryset = queryset.filter(post__id=post_id)
        return queryset

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def toggle_upvote(self, request, pk=None):
        comment = self.get_object()
        user = request.user
        if user in comment.upvoters.all():
            comment.upvoters.remove(user)
            return Response(
                {"upvoted": False, "upvote_count": comment.upvoters.count()}
            )
        else:
            comment.upvoters.add(user)
            return Response({"upvoted": True, "upvote_count": comment.upvoters.count()})


# --- Question Views (Stack) ---


class QuestionViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows questions to be viewed or edited.
    - List: All authenticated users (can filter by space).
    - Create: All authenticated users.
    - Update/Delete: Only the author or Admin/Teacher.
    - Mark as Resolved: Only the author of the question.
    """

    queryset = Question.objects.all().order_by("-created_at")
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["update", "partial_update", "destroy"]:
            self.permission_classes = [IsOwnerOrAdminOrTeacher]
        elif self.action == "mark_resolved":
            self.permission_classes = [
                IsAuthenticated
            ]  # Will check object permission in method
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        space_id = self.request.query_params.get("space_id")
        if space_id:
            queryset = queryset.filter(space__id=space_id)
        return queryset

    @action(detail=True, methods=["get", "post"])
    def answers(self, request, pk=None):
        question = self.get_object()

        if request.method == "GET":
            # Order by number of upvotes (descending), then by newest
            answers = question.answers.annotate(
                upvote_count=Count("upvoters")
            ).order_by("-upvote_count", "-created_at")

            serializer = AnswerSerializer(
                answers, many=True, context={"request": request}
            )
            return Response(serializer.data)

        elif request.method == "POST":
            serializer = AnswerSerializer(
                data=request.data, context={"request": request}
            )
            if serializer.is_valid():
                serializer.save(author=request.user, question=question)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def mark_resolved(self, request, pk=None):
        """
        Mark a question as resolved. Only the author of the question can do this.
        """
        question = self.get_object()
        if question.author != request.user:
            return Response(
                {
                    "detail": "You do not have permission to mark this question as resolved."
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        question.is_resolved = True
        question.save()
        return Response(
            {"detail": "Question marked as resolved."}, status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["POST"])
    def toggle_anticipation(self, request, pk=None):
        question = self.get_object()
        user = request.user

        if user in question.anticipators.all():
            question.anticipators.remove(user)
        else:
            question.anticipators.add(user)

        return Response(
            {"anticipator_count": question.anticipators.count()}, status=200
        )

    @action(detail=True, methods=["get"])
    def anticipators(self, request, pk=None):
        question = self.get_object()
        users = question.anticipators.all()
        serializer = SimpleUserSerializer(
            users, many=True, context={"request": request}
        )
        return Response(serializer.data)


# --- Answer Views ---


class AnswerViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows answers to be viewed or edited.
    - List: All authenticated users (can filter by question).
    - Create: All authenticated users.
    - Update/Delete: Only the author or Admin/Teacher.
    - Mark as Accepted: Only the author of the *question* can accept an answer.
    """

    queryset = Answer.objects.all()
    serializer_class = AnswerSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["update", "partial_update", "destroy"]:
            self.permission_classes = [IsOwnerOrAdminOrTeacher]
        elif self.action == "mark_accepted":
            self.permission_classes = [
                IsAuthenticated
            ]  # Will check object permission in method
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        question_id = self.request.query_params.get("question_id")
        if question_id:
            queryset = queryset.filter(question__id=question_id)
        return queryset

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def mark_accepted(self, request, pk=None):
        """
        Mark an answer as accepted. Only the author of the question can do this.
        """
        answer = self.get_object()
        question = answer.question
        if question.author != request.user:
            return Response(
                {
                    "detail": "You do not have permission to accept an answer for this question."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Optional: Unmark any previously accepted answer for this question
        Answer.objects.filter(question=question, is_accepted=True).update(
            is_accepted=False
        )

        answer.is_accepted = True
        answer.save()
        return Response(
            {"detail": "Answer marked as accepted."}, status=status.HTTP_200_OK
        )

    def perform_update(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=["post"])
    def toggle_upvote(self, request, pk=None):
        answer = self.get_object()
        user = request.user

        if user in answer.upvoters.all():
            answer.upvoters.remove(user)
        else:
            answer.upvoters.add(user)

        return Response({"upvotes": answer.upvoters.count()})


# --- Knowledge Hub Views ---


class KnowledgeHubViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows knowledge hubs to be viewed or edited.
    - List: All authenticated users (public hubs, or private if member of space).
    - Create: Only Teacher users.
    - Update/Delete: Only the creating Teacher or Admin.
    """

    queryset = KnowledgeHub.objects.all()
    serializer_class = KnowledgeHubSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create"]:
            self.permission_classes = [IsTeacherOrAdmin]  # Only teachers can create
        elif self.action in ["update", "partial_update", "destroy"]:
            self.permission_classes = [
                IsOwnerOrAdminOrTeacher
            ]  # Teacher (creator) or Admin
        return super().get_permissions()

    def perform_create(self, serializer):
        # Set the teacher of the hub to the current authenticated user
        serializer.save(teacher=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Admins and Teachers can see all hubs (teachers only their own private ones?)
        # For simplicity, let's say admins see all, teachers see all, students see public or their space's private
        if user.user_type == "admin":
            return queryset
        elif user.user_type == "teacher":
            # Teachers can see all public hubs and their own private hubs
            return queryset.filter(Q(status="public") | Q(teacher=user))
        elif user.user_type == "student":
            # Students can see public hubs
            # And private hubs if they are a member of that space
            my_space_id = None
            try:
                my_space_id = user.space_membership.space.id
            except SpaceMembership.DoesNotExist:
                pass  # User is not in a space

            return queryset.filter(
                Q(status="public") | (Q(status="private") & Q(space__id=my_space_id))
            ).distinct()  # Use distinct to avoid duplicates if a hub is both public and in their space (though status should dictate)
        return queryset.none()  # Default for unauthenticated or other user types


# --- Knowledge Hub Feedback Views ---


class KnowledgeHubFeedbackViewSet(viewsets.ModelViewSet):
    """
    API endpoint for student feedback on knowledge hubs.
    - List: All authenticated users (can filter by hub).
    - Create: Only Student users.
    - Update/Delete: Only the student (creator) or Admin/Teacher.
    """

    queryset = KnowledgeHubFeedback.objects.all()
    serializer_class = KnowledgeHubFeedbackSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create"]:
            self.permission_classes = [IsStudent]
        elif self.action in ["update", "partial_update", "destroy"]:
            self.permission_classes = [
                IsOwnerOrAdminOrTeacher
            ]  # Student (creator), Admin, or Teacher
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        hub_id = self.request.query_params.get("hub_id")
        if hub_id:
            queryset = queryset.filter(hub__id=hub_id)
        return queryset


# --- Peer Review Views ---


class PeerReviewViewSet(viewsets.ModelViewSet):
    """
    API endpoint for peer reviews on knowledge hub feedback.
    - List: All authenticated users (can filter by feedback).
    - Create: Only Student users.
    - Update/Delete: Only the reviewer (creator) or Admin/Teacher.
    """

    queryset = PeerReview.objects.all()
    serializer_class = PeerReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create"]:
            self.permission_classes = [IsStudent]
        elif self.action in ["update", "partial_update", "destroy"]:
            self.permission_classes = [
                IsOwnerOrAdminOrTeacher
            ]  # Reviewer, Admin, or Teacher
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        feedback_id = self.request.query_params.get("feedback_id")
        if feedback_id:
            queryset = queryset.filter(feedback_to_review__id=feedback_id)
        return queryset


# --- Conversation (Messaging) Views ---


class ConversationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing conversations.
    - List: Authenticated users can see their conversations.
    - Create: Authenticated users (students only for direct messages).
    - Retrieve: Only participants.
    - Update/Delete: Not typically allowed for conversations directly,
      but can be extended (e.g., group admin can change name).
    """

    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer
    permission_classes = [
        IsAuthenticated,
        IsConversationParticipant,
    ]  # IsConversationParticipant for object-level

    def get_queryset(self):
        """
        Only return conversations the current user is a participant in.
        """
        user = self.request.user
        if user.is_authenticated:
            return Conversation.objects.filter(participants=user).distinct()
        return Conversation.objects.none()

    def get_permissions(self):
        # Override default permissions for specific actions
        if self.action == "create":
            # Allow any authenticated user to create a conversation,
            # but serializer validation will enforce student-only for DMs.
            self.permission_classes = [IsAuthenticated]
        elif self.action in ["update", "partial_update", "destroy"]:
            # For simplicity, let's restrict update/delete to admins for now
            # or implement more granular group chat admin roles later.
            self.permission_classes = [IsAdminUser]
        return super().get_permissions()

    def perform_create(self, serializer):
        # The serializer's create method handles adding participants.
        # Pass the request user to the serializer context for validation.
        serializer.save(
            owner=self.request.user
        )  # Optional: track creator of conversation

    @action(
        detail=True,
        methods=["get"],
        serializer_class=MessageSerializer,
        permission_classes=[IsAuthenticated, IsConversationParticipant],
    )
    def messages(self, request, pk=None):
        """
        Get all messages for a specific conversation.
        """
        conversation = self.get_object()
        messages = conversation.messages.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(
        detail=True,
        methods=["post"],
        serializer_class=MessageSerializer,
        permission_classes=[IsAuthenticated, IsConversationParticipant],
    )
    def send_message(self, request, pk=None):
        """
        Send a new message to a specific conversation.
        """
        conversation = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(conversation=conversation, sender=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated, IsConversationParticipant],
    )
    def mark_read(self, request, pk=None):
        """
        Mark all messages in a conversation as read for the current user.
        Updates the last_read_message for the ConversationParticipant.
        """
        conversation = self.get_object()
        user = request.user
        try:
            participant = ConversationParticipant.objects.get(
                conversation=conversation, user=user
            )
            last_message = conversation.messages.order_by("-timestamp").first()
            if last_message:
                participant.last_read_message = last_message
                participant.save()
                return Response(
                    {"detail": "Conversation marked as read."},
                    status=status.HTTP_200_OK,
                )
            return Response(
                {"detail": "No messages in conversation to mark as read."},
                status=status.HTTP_204_NO_CONTENT,
            )
        except ConversationParticipant.DoesNotExist:
            return Response(
                {"detail": "You are not a participant in this conversation."},
                status=status.HTTP_403_FORBIDDEN,
            )


# --- Message Views (for direct access/management, less common for chat) ---
# Typically, messages are managed via the ConversationViewSet actions.
# However, if you need to allow direct update/delete of messages, you'd use this:
class MessageViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows messages to be viewed or edited directly.
    Only the sender or Admin/Teacher can update/delete.
    """

    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [
        IsAuthenticated,
        IsOwnerOrAdminOrTeacher,
    ]  # IsOwnerOrAdminOrTeacher for object-level

    def get_permissions(self):
        if self.action == "create":
            # Create is handled via ConversationViewSet.send_message
            self.permission_classes = [permissions.DenyAll]
        return super().get_permissions()

    def perform_create(self, serializer):
        # This view does not support direct creation; use send_message action on ConversationViewSet
        pass


# --- Likes and Upvotes ---

from .models import FeedPostLike, PeerReviewUpvote
from .serializers import FeedPostLikeSerializer, PeerReviewUpvoteSerializer


class FeedPostLikeViewSet(viewsets.ModelViewSet):
    """
    API endpoint to like FeedPosts. Adds +5 rep to the post's author.
    - Create: Authenticated users (cannot like twice).
    - Delete: Authenticated users can remove their like.
    """

    queryset = FeedPostLike.objects.all()
    serializer_class = FeedPostLikeSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        post = serializer.validated_data["post"]
        if post.author == self.request.user:
            raise serializers.ValidationError("You cannot like your own post.")
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def toggle(self, request):
        user = request.user
        post_id = request.data.get("post_id")
        if not post_id:
            return Response(
                {"detail": "post_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )
        try:
            post = FeedPost.objects.get(pk=post_id)
        except FeedPost.DoesNotExist:
            return Response(
                {"detail": "No FeedPost matches the given query."}, status=404
            )
        if post.author == user:
            return Response({"detail": "You cannot like your own post."}, status=400)

        like = FeedPostLike.objects.filter(user=user, post=post).first()
        if like:
            like.delete()
            return Response({"liked": False})
        else:
            FeedPostLike.objects.create(user=user, post=post)
            return Response({"liked": True})


class PeerReviewUpvoteViewSet(viewsets.ModelViewSet):
    """
    API endpoint to upvote PeerReviews. Adds +10 rep to the review's author.
    - Create: Authenticated users (cannot upvote twice).
    - Delete: Authenticated users can remove their upvote.
    """

    queryset = PeerReviewUpvote.objects.all()
    serializer_class = PeerReviewUpvoteSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        review = serializer.validated_data["review"]
        if review.reviewer == self.request.user:
            raise serializers.ValidationError("You cannot upvote your own review.")
            serializer.save(user=self.request.user)
