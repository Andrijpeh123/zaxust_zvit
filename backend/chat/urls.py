from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'conversations', views.ConversationViewSet, basename='conversation')
router.register(r'messages/(?P<message_id>\d+)/reactions', views.ReactionViewSet, basename='reaction')
router.register(r'settings', views.UserSettingsViewSet, basename='settings')
urlpatterns = [
    path('', include(router.urls)),
    path('register/', views.register_user, name='register'),
    path('token-auth/', obtain_auth_token, name='api_token_auth'),
    path('conversations/<int:conversation_id>/delete_chat/', views.delete_chat, name='delete_chat'),
    path('messages/<int:message_id>/mark_read/', views.mark_message_as_read, name='mark_message_as_read'),
]