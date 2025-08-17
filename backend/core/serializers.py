from rest_framework import serializers
from django.db import models
from .models import (
    Space,
    SpaceMembership,
    FeedPost,
    Comment,
    SpaceCategory,
    Question,
    Answer,
    KnowledgeHub,
    KnowledgeHubFeedback,
    PeerReview,
    Conversation,
    ConversationParticipant,
    Message,
    PeerReviewUpvote,
    FeedPostLike,
)
from accounts.serializers import (
    SimpleUserSerializer,
)  # Import the UserSerializer from accounts app
from accounts.models import CustomUser  # Import the CustomUser model

# --- Nested Serializers (for read-only representation of related objects) ---


class SpaceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SpaceCategory
        fields = ("id", "name", "description")


# --- Space Serializers ---


class SpaceSerializer(serializers.ModelSerializer):
    admin = SimpleUserSerializer(read_only=True)  # Nested read-only admin details
    member_count = (
        serializers.SerializerMethodField()
    )  # To show how many members a space has
    members = serializers.SerializerMethodField()
    space_profile_url = serializers.SerializerMethodField()

    space_profile = serializers.ImageField(
        allow_null=True,
        required=False,
    )
    category = SpaceCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=SpaceCategory.objects.all(),
        source="category",
        write_only=True,
        required=False,
        allow_null=True,
        help_text="ID of the category this space belongs to.",
    )

    class Meta:
        model = Space
        fields = (
            "id",
            "name",
            "description",
            "admin",
            "created_at",
            "member_count",
            "members",
            "space_profile",
            "space_profile_url",
            "category",
            "category_id",
        )
        read_only_fields = ("admin",)  # Admin is set by the view, not client input

    def get_member_count(self, obj):
        return obj.memberships.count()  # Count members through the related_name

    def get_members(self, obj):
        memberships = obj.memberships.select_related("user")
        return [SimpleUserSerializer(m.user).data for m in memberships]

    def get_space_profile_url(self, obj):
        request = self.context.get("request")
        if obj.space_profile and request:
            return request.build_absolute_uri(obj.space_profile.url)
        return None


class SpaceMembershipSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)  # Nested read-only user details
    space = SpaceSerializer(read_only=True)  # Nested read-only space details

    class Meta:
        model = SpaceMembership
        fields = ("id", "user", "space", "joined_at")
        read_only_fields = (
            "user",
            "space",
        )  # User and space are set by the view


# --- Feed Post Serializers ---


class FeedPostSerializer(serializers.ModelSerializer):
    author = SimpleUserSerializer(read_only=True)  # Nested read-only author details
    space = SpaceSerializer(
        read_only=True
    )  # Nested read-only space details (if applicable)
    like_count = serializers.SerializerMethodField()
    share_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_shared = serializers.SerializerMethodField()
    space_id = serializers.PrimaryKeyRelatedField(
        queryset=Space.objects.all(),
        source="space",
        write_only=True,
        required=False,
        allow_null=True,
        help_text="ID of the space this post belongs to. Leave null for global posts.",
    )  # For creating/updating, client sends space ID

    class Meta:
        model = FeedPost
        fields = (
            "id",
            "author",
            "space",
            "space_id",
            "title",
            "content",
            "created_at",
            "updated_at",
            "like_count",
            "media",
            "share_count",
            "comment_count",
            "is_liked",
            "is_shared",
        )
        read_only_fields = (
            "author",
            "space",
        )  # Author and space are set by the view

    def get_like_count(self, obj):
        return obj.likes.count()

    def get_share_count(self, obj):
        return obj.shares.count()

    def get_comment_count(self, obj):  # Add this method
        return obj.comments.count()

    def get_is_liked(self, obj):
        request = self.context.get("request", None)
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_is_shared(self, obj):
        request = self.context.get("request", None)
        if request and request.user.is_authenticated:
            return obj.shares.filter(user=request.user).exists()
        return False


# --- Comment Serializers ---


class CommentSerializer(serializers.ModelSerializer):
    author = SimpleUserSerializer(read_only=True)
    post = serializers.PrimaryKeyRelatedField(
        queryset=FeedPost.objects.all(), write_only=True
    )
    upvote_count = serializers.SerializerMethodField()
    is_upvoted = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(
        format="%Y-%m-%dT%H:%M:%S.%fZ", read_only=True
    )

    class Meta:
        model = Comment
        fields = [
            "id",
            "author",
            "content",
            "created_at",
            "updated_at",
            "post",
            "upvote_count",
            "is_upvoted",
        ]
        read_only_fields = ["author", "created_at", "updated_at"]

    def get_upvote_count(self, obj):
        return obj.upvoters.count()

    def get_is_upvoted(self, obj):
        user = self.context["request"].user
        return obj.upvoters.filter(pk=user.pk).exists()


# --- Question & Answer Serializers (Stack) ---


class QuestionSerializer(serializers.ModelSerializer):
    author = SimpleUserSerializer(read_only=True)
    space = SpaceSerializer(read_only=True)
    answer_count = serializers.SerializerMethodField()
    anticipation_count = serializers.SerializerMethodField()
    space_id = serializers.PrimaryKeyRelatedField(
        queryset=Space.objects.all(),
        source="space",
        write_only=True,
        help_text="ID of the space this question belongs to.",
    )

    class Meta:
        model = Question
        fields = (
            "id",
            "author",
            "space",
            "space_id",
            "title",
            "content",
            "is_resolved",
            "created_at",
            "updated_at",
            "answer_count",
            "anticipation_count",
        )
        read_only_fields = (
            "author",
            "space",
            "is_resolved",
        )  # Author and space set by view, is_resolved updated via specific action

    def get_answer_count(self, obj):
        return obj.answers.count()

    def get_anticipation_count(self, obj):
        return obj.anticipators.count()


class AnswerSerializer(serializers.ModelSerializer):
    author = SimpleUserSerializer(read_only=True)
    question = QuestionSerializer(read_only=True)
    upvotes = serializers.SerializerMethodField()
    question_id = serializers.PrimaryKeyRelatedField(
        queryset=Question.objects.all(),
        source="question",
        write_only=True,
        required=False,
    )
    created_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Answer
        fields = (
            "id",
            "author",
            "question",
            "question_id",
            "content",
            "is_accepted",
            "created_at",
            "updated_at",
            "upvotes",
        )
        read_only_fields = ("author", "question", "is_accepted")

    def get_upvotes(self, obj):
        return obj.upvoters.count()


# --- Knowledge Hub Serializers ---


class KnowledgeHubSerializer(serializers.ModelSerializer):
    teacher = SimpleUserSerializer(read_only=True)
    space = SpaceSerializer(read_only=True)  # Nested space details (if private)
    space_id = serializers.PrimaryKeyRelatedField(
        queryset=Space.objects.all(),
        source="space",
        write_only=True,
        required=False,
        allow_null=True,
        help_text="ID of the space this hub is associated with (required for private hubs).",
    )

    class Meta:
        model = KnowledgeHub
        fields = (
            "id",
            "teacher",
            "space",
            "space_id",
            "title",
            "prompt",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "teacher",
            "space",
        )  # Teacher and space set by view

    def validate(self, data):
        # Custom validation for private hubs requiring a space
        if data.get("status") == "private" and not data.get("space"):
            raise serializers.ValidationError(
                "Private knowledge hubs must be associated with a space."
            )
        return data


class KnowledgeHubFeedbackSerializer(serializers.ModelSerializer):
    student = SimpleUserSerializer(read_only=True)
    hub = KnowledgeHubSerializer(read_only=True)
    hub_id = serializers.PrimaryKeyRelatedField(
        queryset=KnowledgeHub.objects.all(),
        source="hub",
        write_only=True,
        help_text="ID of the knowledge hub this feedback belongs to.",
    )

    class Meta:
        model = KnowledgeHubFeedback
        fields = (
            "id",
            "student",
            "hub",
            "hub_id",
            "content",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "student",
            "hub",
        )  # Student and hub set by view


class PeerReviewSerializer(serializers.ModelSerializer):
    reviewer = SimpleUserSerializer(read_only=True)
    feedback_to_review = KnowledgeHubFeedbackSerializer(read_only=True)
    feedback_to_review_id = serializers.PrimaryKeyRelatedField(
        queryset=KnowledgeHubFeedback.objects.all(),
        source="feedback_to_review",
        write_only=True,
        help_text="ID of the knowledge hub feedback being reviewed.",
    )

    class Meta:
        model = PeerReview
        fields = (
            "id",
            "reviewer",
            "feedback_to_review",
            "feedback_to_review_id",
            "review_content",
            "rating",
            "created_at",
            "upvote_count",
        )
        read_only_fields = (
            "reviewer",
            "feedback_to_review",
        )  # Reviewer and feedback set by view

    def get_upvote_count(self, obj):
        return obj.upvotes.count()


# --- Conversation (Messaging) Serializers ---


class MessageSerializer(serializers.ModelSerializer):
    sender = SimpleUserSerializer(read_only=True)  # Nested read-only sender details
    conversation = serializers.PrimaryKeyRelatedField(
        queryset=Conversation.objects.all(), write_only=True
    )  # For creating, client sends conversation ID

    class Meta:
        model = Message
        fields = ("id", "conversation", "sender", "content", "timestamp")
        read_only_fields = (
            "sender",
            "timestamp",
        )  # Sender and timestamp set by view


class ConversationParticipantSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)
    last_read_message = MessageSerializer(
        read_only=True
    )  # Optional: nested message detail

    class Meta:
        model = ConversationParticipant
        fields = ("id", "user", "joined_at", "last_read_message")
        read_only_fields = (
            "user",
            "last_read_message",
        )


class ConversationSerializer(serializers.ModelSerializer):
    # Participants will be added/removed via a separate endpoint or method
    # For display, we can show a list of simple participant serializers
    participants = SimpleUserSerializer(many=True, read_only=True)
    # A list of participant IDs for creating a conversation
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        help_text="List of user IDs to include in the conversation.",
    )
    last_message = (
        serializers.SerializerMethodField()
    )  # To show the last message in the conversation

    class Meta:
        model = Conversation
        fields = (
            "id",
            "name",
            "is_group_chat",
            "created_at",
            "updated_at",
            "participants",
            "participant_ids",
            "last_message",
        )
        read_only_fields = (
            "created_at",
            "updated_at",
        )

    def get_last_message(self, obj):
        # Get the most recent message for the conversation
        last_msg = obj.messages.order_by("-timestamp").first()
        if last_msg:
            return MessageSerializer(last_msg).data
        return None

    def create(self, validated_data):
        participant_ids = validated_data.pop("participant_ids", [])
        is_group_chat = validated_data.get("is_group_chat", False)

        # Ensure the creator is always a participant
        request_user = self.context["request"].user
        if request_user.id not in participant_ids:
            participant_ids.append(request_user.id)

        # For direct messages, ensure only two unique participants
        if not is_group_chat and len(set(participant_ids)) > 2:
            raise serializers.ValidationError(
                "Direct messages can only have two participants."
            )

        # Check if a direct conversation already exists between these two users
        if not is_group_chat and len(set(participant_ids)) == 2:
            user1_id, user2_id = sorted(list(set(participant_ids)))
            existing_conv = (
                Conversation.objects.filter(
                    is_group_chat=False, participants__id=user1_id
                )
                .filter(participants__id=user2_id)
                .annotate(num_participants=models.Count("participants"))
                .filter(num_participants=2)
                .first()
            )

            if existing_conv:
                return existing_conv  # Return existing conversation instead of creating a duplicate

        conversation = Conversation.objects.create(**validated_data)

        # Add participants to the conversation
        for user_id in participant_ids:
            user = CustomUser.objects.get(id=user_id)
            ConversationParticipant.objects.create(conversation=conversation, user=user)

        return conversation

    def update(self, instance, validated_data):
        # Update logic for conversation name or other fields
        instance.name = validated_data.get("name", instance.name)
        instance.is_group_chat = validated_data.get(
            "is_group_chat", instance.is_group_chat
        )
        instance.save()
        return instance


class FeedPostLikeSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)
    post_id = serializers.PrimaryKeyRelatedField(
        queryset=FeedPost.objects.all(), source="post", write_only=True
    )

    class Meta:
        model = FeedPostLike
        fields = ("id", "user", "post_id", "created_at")
        read_only_fields = ("user", "created_at")


class PeerReviewUpvoteSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)
    review_id = serializers.PrimaryKeyRelatedField(
        queryset=PeerReview.objects.all(), source="review", write_only=True
    )

    class Meta:
        model = PeerReviewUpvote
        fields = ("id", "user", "review_id", "created_at")
        read_only_fields = ("user", "created_at")
