# community/models.py
from django.db import models
from django.conf import settings  # To reference AUTH_USER_MODEL
from django.utils import timezone  # For timestamping
from accounts.models import CustomUser


class SpaceCategory(models.Model):
    """
    Represents categories that spaces can belong to.
    """

    name = models.CharField(max_length=100, unique=True, help_text="Category name.")
    description = models.TextField(blank=True, help_text="Description of the category.")

    class Meta:
        verbose_name_plural = "Space Categories"

    def __str__(self):
        return self.name


class Space(models.Model):
    """
    Represents a community space.
    Only Admins can create spaces.
    """

    name = models.CharField(max_length=100, unique=True, help_text="Name of the space.")
    description = models.TextField(blank=True, help_text="Description of the space.")
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,  # Prevent deletion of admin if they manage spaces
        limit_choices_to={"user_type": "admin"},  # Only admins can be creators
        related_name="managed_spaces",
        help_text="The administrator who created and manages this space.",
    )
    created_at = models.DateTimeField(
        auto_now_add=True, help_text="Timestamp when the space was created."
    )
    space_profile = models.ImageField(
        upload_to="space_profiles/",
        null=True,
        blank=True,
        help_text="Optional profile picture for the space.",
    )
    category = models.ForeignKey(
        SpaceCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="spaces",
        help_text="Category of this space.",
    )

    class Meta:
        verbose_name_plural = "Spaces"  # Correct pluralization in admin

    def __str__(self):
        return self.name


class SpaceMembership(models.Model):
    """
    Manages membership of users (students/teachers) to a single space.
    A user can only join 1 space.
    """

    user = models.OneToOneField(  # OneToOneField to enforce one user per membership
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="space_membership",  # Access membership from user: user.space_membership
        help_text="The user (student or teacher) who is a member of this space.",
    )
    space = models.ForeignKey(
        Space,
        on_delete=models.CASCADE,
        related_name="memberships",  # Access memberships from space: space.memberships.all()
        help_text="The space this user is a member of.",
    )
    joined_at = models.DateTimeField(
        auto_now_add=True, help_text="Timestamp when the user joined the space."
    )

    class Meta:
        unique_together = (
            "user",
            "space",
        )  # Ensures a user can't join the same space twice
        # The OneToOneField on `user` already enforces that a user can only have one membership,
        # but unique_together adds an extra layer for user-space combination.

    def __str__(self):
        return f"{self.user.username} is a member of {self.space.name}"


class FeedPost(models.Model):
    """
    Daily feed posts provided by admins and teachers.
    Can be global (space=None) or specific to a space.
    """

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={
            "user_type__in": ["admin", "teacher"]
        },  # Only admins/teachers can post
        related_name="authored_posts",
        help_text="The user (admin or teacher) who created this post.",
    )
    space = models.ForeignKey(
        Space,
        on_delete=models.SET_NULL,  # If space is deleted, posts become global (space=None)
        null=True,
        blank=True,
        related_name="space_posts",
        help_text="The space this post belongs to (optional, for global posts).",
    )
    title = models.CharField(max_length=255, help_text="Title of the feed post.")
    content = models.TextField(help_text="Content of the feed post.")
    created_at = models.DateTimeField(
        auto_now_add=True, help_text="Timestamp when the post was created."
    )
    updated_at = models.DateTimeField(
        auto_now=True, help_text="Timestamp when the post was last updated."
    )
    media = models.FileField(
        upload_to="feed_posts/",
        null=True,
        blank=True,
        help_text="Optional media file (image) associated with the post.",
    )

    class Meta:
        ordering = ["-created_at"]  # Order posts by most recent first

    def __str__(self):
        return f"Post by {self.author.username}: {self.title[:50]}..."


class Comment(models.Model):
    """
    Comments on Feed Posts.
    """

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="authored_comments",
        help_text="The user who created this comment.",
    )
    post = models.ForeignKey(
        FeedPost,
        on_delete=models.CASCADE,
        related_name="comments",  # Access comments from post: post.comments.all()
        help_text="The post this comment belongs to.",
    )
    content = models.TextField(help_text="Content of the comment.")
    created_at = models.DateTimeField(
        auto_now_add=True, help_text="Timestamp when the comment was created."
    )
    updated_at = models.DateTimeField(
        auto_now=True, help_text="Timestamp when the comment was last updated."
    )
    upvoters = models.ManyToManyField(
        CustomUser, related_name="upvoted_comments", blank=True
    )

    class Meta:
        ordering = ["created_at"]  # Order comments by oldest first

    def __str__(self):
        return f"Comment by {self.author.username} on {self.post.title[:30]}..."


class Question(models.Model):
    """
    Questions for the 'Stack' tab, specific to a space.
    """

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="authored_questions",
        help_text="The user who asked this question.",
    )
    space = models.ForeignKey(
        Space,
        on_delete=models.CASCADE,  # Questions are tied to their space
        related_name="questions",  # Access questions from space: space.questions.all()
        help_text="The space this question belongs to.",
    )
    title = models.CharField(max_length=255, help_text="Title of the question.")
    content = models.TextField(help_text="Detailed content of the question.")
    created_at = models.DateTimeField(
        auto_now_add=True, help_text="Timestamp when the question was created."
    )
    updated_at = models.DateTimeField(
        auto_now=True, help_text="Timestamp when the question was last updated."
    )
    is_resolved = models.BooleanField(
        default=False, help_text="Indicates if the question has been resolved."
    )
    anticipators = models.ManyToManyField(
        CustomUser, related_name="anticipated_questions", blank=True
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Q: {self.title[:50]}... in {self.space.name}"


class Answer(models.Model):
    """
    Answers to Questions in the 'Stack'.
    """

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="authored_answers",
        help_text="The user who provided this answer.",
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="answers",  # Access answers from question: question.answers.all()
        help_text="The question this answer belongs to.",
    )
    content = models.TextField(help_text="Content of the answer.")
    created_at = models.DateTimeField(
        auto_now_add=True, help_text="Timestamp when the answer was created."
    )
    updated_at = models.DateTimeField(
        auto_now=True, help_text="Timestamp when the answer was last updated."
    )
    is_accepted = models.BooleanField(
        default=False,
        help_text="Indicates if this is the accepted answer for the question.",
    )
    upvoters = models.ManyToManyField(
        CustomUser,
        related_name="upvoted_answers",
        blank=True,
        help_text="Users who upvoted this answer.",
    )

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Answer by {self.author.username} to {self.question.title[:30]}..."

    def upvote_count(self):
        return self.upvoters.count()


class KnowledgeHub(models.Model):
    """
    Teacher-created knowledge hubs for peer feedback.
    Can be public (accessible to everyone) or private (tied to a specific space).
    """

    HUB_STATUS_CHOICES = (
        ("public", "Public"),
        ("private", "Private"),
    )
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={"user_type": "teacher"},  # Only teachers can create hubs
        related_name="created_hubs",
        help_text="The teacher who created this knowledge hub.",
    )
    space = models.ForeignKey(
        Space,
        on_delete=models.CASCADE,
        null=True,  # Can be null if public and not tied to a specific space
        blank=True,
        related_name="knowledge_hubs",
        help_text="The space this hub is associated with (required for private hubs).",
    )
    title = models.CharField(max_length=255, help_text="Title of the knowledge hub.")
    prompt = models.TextField(
        help_text="The prompt for students to provide feedback on."
    )
    status = models.CharField(
        max_length=10,
        choices=HUB_STATUS_CHOICES,
        default="public",
        help_text="Visibility status of the knowledge hub (public or private).",
    )
    created_at = models.DateTimeField(
        auto_now_add=True, help_text="Timestamp when the hub was created."
    )
    updated_at = models.DateTimeField(
        auto_now=True, help_text="Timestamp when the hub was last updated."
    )

    class Meta:
        verbose_name_plural = "Knowledge Hubs"
        constraints = [
            models.CheckConstraint(
                check=models.Q(status="public") | models.Q(space__isnull=False),
                name="private_hub_must_have_space",
                # Ensures that if status is 'private', space cannot be null.
                # If status is 'public', space can be null or not.
            )
        ]

    def __str__(self):
        return f"Hub: {self.title[:50]}... ({self.get_status_display()})"


class KnowledgeHubFeedback(models.Model):
    """
    Student responses/feedback to a Knowledge Hub prompt.
    """

    hub = models.ForeignKey(
        KnowledgeHub,
        on_delete=models.CASCADE,
        related_name="feedbacks",  # Access feedback from hub: hub.feedbacks.all()
        help_text="The knowledge hub this feedback belongs to.",
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={"user_type": "student"},  # Only students provide feedback
        related_name="hub_feedbacks",
        help_text="The student who provided this feedback.",
    )
    content = models.TextField(
        help_text="The constructive feedback provided by the student."
    )
    created_at = models.DateTimeField(
        auto_now_add=True, help_text="Timestamp when the feedback was provided."
    )
    updated_at = models.DateTimeField(
        auto_now=True, help_text="Timestamp when the feedback was last updated."
    )

    class Meta:
        ordering = ["created_at"]
        unique_together = (
            "hub",
            "student",
        )  # A student can only submit one feedback per hub

    def __str__(self):
        return f"Feedback by {self.student.username} on {self.hub.title[:30]}..."


class PeerReview(models.Model):
    """
    Represents one student peer-reviewing another student's Knowledge Hub Feedback.
    """

    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="given_peer_reviews",
        limit_choices_to={"user_type": "student"},
        help_text="The student who is providing the review.",
    )
    feedback_to_review = models.ForeignKey(
        KnowledgeHubFeedback,
        on_delete=models.CASCADE,
        related_name="peer_reviews",
        help_text="The specific knowledge hub feedback being reviewed.",
    )
    review_content = models.TextField(help_text="The content of the peer review.")
    rating = models.IntegerField(
        null=True,
        blank=True,
        help_text="Optional rating for the feedback (e.g., 1-5 stars).",
    )
    created_at = models.DateTimeField(
        auto_now_add=True, help_text="Timestamp when the review was created."
    )

    class Meta:
        unique_together = (
            "reviewer",
            "feedback_to_review",
        )  # A student can only review a specific feedback once

    def __str__(self):
        return f"Review by {self.reviewer.username} on {self.feedback_to_review.student.username}'s feedback"


class FeedPostLike(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    post = models.ForeignKey(FeedPost, on_delete=models.CASCADE, related_name="likes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "post")

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.post.author.profile.rep += 5
        self.post.author.profile.save()

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        self.post.author.profile.rep = max(0, self.post.author.profile.rep - 5)
        self.post.author.profile.save()


class FeedPostShare(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    post = models.ForeignKey(FeedPost, on_delete=models.CASCADE, related_name="shares")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "post")

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.post.author.profile.rep += 1
        self.post.author.profile.save()

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        self.post.author.profile.rep = max(0, self.post.author.profile.rep - 1)
        self.post.author.profile.save()


class PeerReviewUpvote(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    review = models.ForeignKey(
        PeerReview, on_delete=models.CASCADE, related_name="upvotes"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "review")

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.review.reviewer.profile.rep += 10
        self.review.reviewer.profile.save()

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        self.review.reviewer.profile.rep = max(0, self.review.reviewer.profile.rep - 10)
        self.review.reviewer.profile.save()


class Conversation(models.Model):
    """
    Represents a chat conversation or thread.
    Can be a direct message (between two users) or a group chat.
    """

    # For group chats, this will be the group name.
    # For direct messages, it can be left blank or auto-generated (e.g., "UserA & UserB").
    name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Name of the conversation (e.g., for group chats).",
    )
    # Participants in the conversation. This is a ManyToManyField through ConversationParticipant.
    # This allows us to add extra information to the relationship (like joined_at, last_read_message).
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="ConversationParticipant",
        related_name="conversations",  # Access conversations from user: user.conversations.all()
        help_text="Users participating in this conversation.",
    )
    is_group_chat = models.BooleanField(
        default=False,
        help_text="True if this is a group chat, False for a direct (1-on-1) message.",
    )
    created_at = models.DateTimeField(
        auto_now_add=True, help_text="Timestamp when the conversation was created."
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the conversation was last updated (e.g., new message).",
    )

    class Meta:
        ordering = ["-updated_at"]  # Show most recently active conversations first

    def __str__(self):
        if self.name:
            return self.name
        # For direct messages, try to generate a name from participants
        # This will require fetching participants, so be careful in queries
        participant_names = ", ".join([p.username for p in self.participants.all()])
        return f"Conversation with {participant_names}"


class ConversationParticipant(models.Model):
    """
    Intermediate model for the Many-to-Many relationship between Conversation and User.
    Allows adding extra fields to the relationship, such as when a user joined
    or the last message they read in a conversation.
    """

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="participant_links",  # Access links from conversation: conversation.participant_links.all()
        help_text="The conversation this participant belongs to.",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversation_links",  # Access links from user: user.conversation_links.all()
        help_text="The user participating in this conversation.",
    )
    joined_at = models.DateTimeField(
        auto_now_add=True, help_text="Timestamp when the user joined the conversation."
    )
    # Optional: To track read status per user per conversation
    last_read_message = models.ForeignKey(
        "Message",  # Forward reference to Message model
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="read_by_participants",
        help_text="The last message read by this participant in this conversation.",
    )

    class Meta:
        unique_together = (
            "conversation",
            "user",
        )  # A user can only be a participant once per conversation
        verbose_name = "Conversation Participant"
        verbose_name_plural = "Conversation Participants"

    def __str__(self):
        return (
            f"{self.user.username} in {self.conversation.name or self.conversation.id}"
        )


class Message(models.Model):
    """
    Represents an individual message within a conversation.
    """

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",  # Access messages from conversation: conversation.messages.all()
        help_text="The conversation this message belongs to.",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages",  # Access sent messages from user: user.sent_messages.all()
        help_text="The user who sent this message.",
    )
    content = models.TextField(help_text="Content of the message.")
    timestamp = models.DateTimeField(
        auto_now_add=True, help_text="Timestamp when the message was sent."
    )

    class Meta:
        ordering = ["timestamp"]  # Order messages by time sent
        verbose_name = "Message"
        verbose_name_plural = "Messages"

    def __str__(self):
        return f"Msg by {self.sender.username} in {self.conversation.name or self.conversation.id}: {self.content[:50]}..."
