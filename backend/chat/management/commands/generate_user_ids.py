import uuid
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from chat.models import UserProfile

class Command(BaseCommand):
    help = 'Generate unique IDs for users who do not have one'

    def handle(self, *args, **options):
        users_without_profile = User.objects.filter(profile__isnull=True)
        profiles_without_id = UserProfile.objects.filter(unique_id__isnull=True) | UserProfile.objects.filter(unique_id='')
        
        # Create profiles for users without one
        for user in users_without_profile:
            UserProfile.objects.create(user=user, unique_id=uuid.uuid4().hex[:8].upper())
            self.stdout.write(self.style.SUCCESS(f'Created profile with ID for user: {user.username}'))
        
        # Generate IDs for profiles without one
        for profile in profiles_without_id:
            profile.unique_id = uuid.uuid4().hex[:8].upper()
            profile.save()
            self.stdout.write(self.style.SUCCESS(f'Generated ID for user: {profile.user.username}'))
        
        self.stdout.write(self.style.SUCCESS('Successfully generated unique IDs for all users'))