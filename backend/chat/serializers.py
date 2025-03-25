from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Conversation, Message, Reaction, UserSettings, UserProfile
from django.conf import settings
import os

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    unique_id = serializers.SerializerMethodField()
    qr_code = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'avatar', 'unique_id', 'qr_code']
    
    def get_avatar(self, obj):
        request = self.context.get('request')
        
        # Check if user has a profile with an avatar
        if hasattr(obj, 'profile') and obj.profile and obj.profile.avatar:
            if request:
                return request.build_absolute_uri(obj.profile.avatar.url)
            return obj.profile.avatar.url
        
        # Return default avatar URL
        default_avatar_path = 'avatars/default.png'
        if request:
            return request.build_absolute_uri(settings.MEDIA_URL + default_avatar_path)
        return settings.MEDIA_URL + default_avatar_path
    
    def get_qr_code(self, obj):
        request = self.context.get('request')
        try:
            if hasattr(obj, 'profile') and obj.profile and obj.profile.qr_code:
                if request:
                    return request.build_absolute_uri(obj.profile.qr_code.url)
                return obj.profile.qr_code.url
        except Exception as e:
            print(f"Error getting QR code for user {obj.username}:", str(e))
        return None

    def get_unique_id(self, obj):
        try:
            if hasattr(obj, 'profile') and obj.profile:
                return obj.profile.unique_id
        except Exception as e:
            print(f"Error getting unique_id for user {obj.username}:", str(e))
        return None

class ReactionSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    user_id = serializers.SerializerMethodField()
    user_avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = Reaction
        fields = ['id', 'emoji', 'user_id', 'username', 'user_avatar', 'message_id']
    
    def get_username(self, obj):
        return obj.user.username
    
    def get_user_id(self, obj):
        return obj.user.id
    
    def get_user_avatar(self, obj):
        request = self.context.get('request')
        if hasattr(obj.user, 'profile') and obj.user.profile and obj.user.profile.avatar:
            if request:
                return request.build_absolute_uri(obj.user.profile.avatar.url)
            return obj.user.profile.avatar.url
        
        # Return default avatar URL
        default_avatar_path = 'avatars/default.png'
        if request:
            return request.build_absolute_uri(settings.MEDIA_URL + default_avatar_path)
        return settings.MEDIA_URL + default_avatar_path

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer()
    reactions = ReactionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'timestamp', 'is_read', 'reactions']

class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'created_at', 'updated_at', 'last_message']
    
    def get_last_message(self, obj):
        last_message = obj.messages.order_by('-timestamp').first()
        if last_message:
            return MessageSerializer(last_message).data
        return None


class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = ['theme', 'notification_enabled', 'message_sound_enabled', 'language']