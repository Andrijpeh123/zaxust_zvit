import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import async_to_sync
from django.contrib.auth.models import User
from .models import Conversation, Message

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']
        user_id = data['user_id']
        await self.save_message(user_id, message)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'user_id': user_id
            }
        )
    async def chat_message(self, event):
        message = event['message']
        user_id = event['user_id']
        await self.send(text_data=json.dumps({
            'message': message,
            'user_id': user_id
        }))
    @database_sync_to_async
    def save_message(self, user_id, message):
        try:
            user = User.objects.get(id=user_id)
            conversation = Conversation.objects.get(id=self.conversation_id)
            message_obj = Message.objects.create(
                conversation=conversation,
                sender=user,
                content=message
            )
            return message_obj
        except Exception as e:
            print(f"Error saving message: {e}")
            return None
        from asgiref.sync import sync_to_async
        from channels.layers import get_channel_layer
        
        # Serialize the message for notifications
        from .serializers import MessageSerializer
        message_data = MessageSerializer(message_obj).data
        
        # Get channel layer outside of async context
        channel_layer = get_channel_layer()
        
        # Notify all participants about the new message
        for participant in conversation.participants.all():
            # Use sync_to_async since we're in a sync function that was called from async
            @sync_to_async
            def send_notification():
                async_to_sync(channel_layer.group_send)(
                    f'notifications_{participant.id}',
                    {
                        'type': 'new_message',
                        'conversation_id': conversation.id,
                        'message': message_data
                    }
                )
            
            # Execute the notification sending
            sync_to_async(send_notification)()
        
        return message_obj


# Add this new consumer to your existing consumers.py file

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.notification_group_name = f'notifications_{self.user_id}'

        # Join notification group
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave notification group
        await self.channel_layer.group_discard(
            self.notification_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        pass  # We don't expect to receive messages from the client

    # Send notification about new conversation
    async def new_conversation(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'new_conversation',
            'conversation_id': event['conversation_id'],
            'participants': event['participants']
        }))

    # Send notification about new message
    async def new_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'conversation_id': event['conversation_id'],
            'message': event['message']
        }))