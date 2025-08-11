from django.contrib import admin
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
    SpaceCategory,
)

# Register all models
admin.site.register([
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
    SpaceCategory,
])
