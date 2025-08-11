from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SpaceViewSet, FeedPostViewSet, CommentViewSet,
    QuestionViewSet, AnswerViewSet, KnowledgeHubViewSet,
    KnowledgeHubFeedbackViewSet, PeerReviewViewSet,
    ConversationViewSet, MessageViewSet,
    FeedPostLikeViewSet, PeerReviewUpvoteViewSet  # 🆕 added
)

router = DefaultRouter()
router.register(r'spaces', SpaceViewSet)
router.register(r'posts', FeedPostViewSet, basename='post')  
router.register(r'comments', CommentViewSet)
router.register(r'questions', QuestionViewSet,basename='question')
router.register(r'answers', AnswerViewSet)
router.register(r'knowledge-hubs', KnowledgeHubViewSet)
router.register(r'feedback', KnowledgeHubFeedbackViewSet)
router.register(r'reviews', PeerReviewViewSet)
router.register(r'conversations', ConversationViewSet)
router.register(r'messages', MessageViewSet)

# 🆕 New routes for likes and upvotes
router.register(r'post-likes', FeedPostLikeViewSet)
router.register(r'peer-review-upvotes', PeerReviewUpvoteViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
