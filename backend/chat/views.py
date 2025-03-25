from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Conversation, Message, Reaction, UserSettings, UserProfile
from .serializers import (UserSerializer, ConversationSerializer, MessageSerializer, ReactionSerializer,UserSettingsSerializer)
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Conversation
class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response({'error': 'Search query is required'}, status=status.HTTP_400_BAD_REQUEST)
        users = User.objects.filter(
            Q(username__icontains=query) | 
            Q(profile__unique_id__iexact=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        ).exclude(id=request.user.id)[:10] 
        
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def me(self, request):
        try:
            
            try:
                profile = request.user.profile
            except ObjectDoesNotExist:
                profile = UserProfile.objects.create(user=request.user)
            
            
            if not profile.qr_code:
                profile.save()  
            
            print("User profile data:", {
                'user_id': request.user.id,
                'username': request.user.username,
                'profile_id': profile.id,
                'qr_code': profile.qr_code.url if profile.qr_code else None,
                'unique_id': profile.unique_id
            })
            
            serializer = self.get_serializer(request.user, context={'request': request})
            return Response(serializer.data)
            
        except Exception as e:
            print("Error in /users/me/:", str(e))
            return Response(
                {"error": "Failed to get user data", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        messages = conversation.messages.all().order_by('timestamp')
        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def clear_chat(self, request, pk=None):
        conversation = self.get_object()
        if request.user not in conversation.participants.all():
            return Response({'error': 'You are not a participant in this conversation'}, 
                            status=status.HTTP_403_FORBIDDEN)
        Message.objects.filter(conversation=conversation).delete()
        return Response({'status': 'Chat cleared successfully'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        conversation = self.get_object()
        content = request.data.get('content')
        
        if not content:
            return Response({'error': 'Content is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content
        )
        
        serializer = MessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def start_conversation(self, request):
        user_ids = request.data.get('user_ids', [])
        
        if not user_ids:
            return Response({'error': 'At least one user ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        user_ids.append(request.user.id)
        user_ids = list(set(user_ids))  
        participants = User.objects.filter(id__in=user_ids)
        
        if participants.count() != len(user_ids):
            return Response({'error': 'One or more users not found'}, status=status.HTTP_400_BAD_REQUEST)
        
        conversation = Conversation.objects.create()
        conversation.participants.set(participants)
        
        serializer = ConversationSerializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def register_user(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    if not username or not email or not password:
        return Response({'message': 'Please provide username, email and password'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(username=username).exists():
        return Response({'message': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=email).exists():
        return Response({'message': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
    user = User.objects.create_user(username=username, email=email, password=password)
    if 'avatar' in request.FILES:
        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.avatar = request.FILES['avatar']
        profile.save()
    return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)

class ReactionViewSet(viewsets.ModelViewSet):
    serializer_class = ReactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        message_id = self.kwargs.get('message_id')
        return Reaction.objects.filter(message_id=message_id)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context
    
    def perform_create(self, serializer):
        message_id = self.kwargs.get('message_id')
        try:
            message = Message.objects.get(id=message_id)
            emoji = self.request.data.get('emoji')
            existing_reaction = Reaction.objects.filter(
                message=message,
                user=self.request.user,
                emoji=emoji
            ).first()
            
            if existing_reaction:
                return Response(ReactionSerializer(existing_reaction).data)
            reaction = serializer.save(message=message, user=self.request.user)
            return Response(ReactionSerializer(reaction).data)
        except Message.DoesNotExist:
            return Response(
                {"error": "Message not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
class UserSettingsViewSet(viewsets.ModelViewSet):
    serializer_class = UserSettingsSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return UserSettings.objects.filter(user=self.request.user)
    def get_object(self):
        settings, created = UserSettings.objects.get_or_create(user=self.request.user)
        return settings
    

@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def delete_chat(request, conversation_id):
    try:
        conversation = Conversation.objects.get(id=conversation_id)
        if request.user not in conversation.participants.all():
            return Response({"error": "You are not a participant in this conversation"}, status=status.HTTP_403_FORBIDDEN)
        conversation.delete()
        return Response({"message": "Chat deleted successfully"}, status=status.HTTP_200_OK)
    except Conversation.DoesNotExist:
        return Response({"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_message_as_read(request, message_id):
    try:
        message = Message.objects.get(id=message_id)
        if request.user in message.conversation.participants.all():
            message.is_read = True
            message.save()
            return Response({'status': 'success'})
        return Response({'error': 'Unauthorized'}, status=403)
    except Message.DoesNotExist:
        return Response({'error': 'Message not found'}, status=404)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_message(request, message_id):
    try:
        message = Message.objects.get(id=message_id)
       
        if request.user == message.sender:
            message.delete()
            return Response({'status': 'success'}, status=status.HTTP_200_OK)
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    except Message.DoesNotExist:
        return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)