from django.db import models
from django.contrib.auth.models import User
import uuid
import qrcode
from io import BytesIO
from django.core.files import File
from django.db.models.signals import post_save
from django.dispatch import receiver

class Conversation(models.Model):
    participants = models.ManyToManyField(User, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conversation {self.id}"

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(User, related_name='sent_messages', on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Message {self.id} from {self.sender.username}"

class Reaction(models.Model):
    message = models.ForeignKey(Message, related_name='reactions', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='reactions', on_delete=models.CASCADE)
    emoji = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'user', 'emoji')
        
    def __str__(self):
        return f"{self.user.username} reacted with {self.emoji} to message {self.message.id}"

class UserSettings(models.Model):
    user = models.OneToOneField(User, related_name='settings', on_delete=models.CASCADE)
    theme = models.CharField(max_length=20, default='light')
    notification_enabled = models.BooleanField(default=True)
    message_sound_enabled = models.BooleanField(default=True)
    language = models.CharField(max_length=10, default='en')
    
    def __str__(self):
        return f"Settings for {self.user.username}"


class UserProfile(models.Model):
    user = models.OneToOneField(User, related_name='profile', on_delete=models.CASCADE)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    unique_id = models.CharField(max_length=8, unique=True, blank=True)
    qr_code = models.ImageField(upload_to='qr_codes/', null=True, blank=True)
    
    def __str__(self):
        return f"Profile for {self.user.username}"
    
    def save(self, *args, **kwargs):
        try:
            if not self.unique_id:
                self.unique_id = uuid.uuid4().hex[:8].upper()
            
            if not self.qr_code:
                qr = qrcode.QRCode(
                    version=1,
                    error_correction=qrcode.constants.ERROR_CORRECT_L,
                    box_size=10,
                    border=4,
                )
                qr.add_data(f"User ID: {self.unique_id}\nUsername: {self.user.username}")
                qr.make(fit=True)

                img = qr.make_image(fill_color="black", back_color="white")
                
                buffer = BytesIO()
                img.save(buffer, format='PNG')
                filename = f'qr_code_{self.unique_id}.png'
                self.qr_code.save(filename, File(buffer), save=False)
                
        except Exception as e:
            print(f"Error generating QR code for user {self.user.username}:", str(e))
            
        super().save(*args, **kwargs)

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if not hasattr(instance, 'profile'):
        UserProfile.objects.create(user=instance)
    instance.profile.save()