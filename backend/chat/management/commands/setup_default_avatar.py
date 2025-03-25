import os
import base64
from io import BytesIO
from PIL import Image, ImageDraw
from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.files.base import ContentFile

class Command(BaseCommand):
    help = 'Sets up the default avatar image programmatically'

    def handle(self, *args, **options):
        # Create media directory if it doesn't exist
        media_dir = settings.MEDIA_ROOT
        avatars_dir = os.path.join(media_dir, 'avatars')
        
        if not os.path.exists(media_dir):
            os.makedirs(media_dir)
            self.stdout.write(self.style.SUCCESS(f'Created media directory at {media_dir}'))
            
        if not os.path.exists(avatars_dir):
            os.makedirs(avatars_dir)
            self.stdout.write(self.style.SUCCESS(f'Created avatars directory at {avatars_dir}'))
        
        default_avatar_dest = os.path.join(avatars_dir, 'default.png')
        
        # Generate a default avatar if it doesn't exist
        if not os.path.exists(default_avatar_dest):
            # Generate a simple avatar (a colored circle with initials)
            img = self.generate_default_avatar()
            
            # Save the generated avatar
            img.save(default_avatar_dest, 'PNG')
            self.stdout.write(self.style.SUCCESS(f'Generated default avatar at {default_avatar_dest}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Default avatar already exists at {default_avatar_dest}'))
    
    def generate_default_avatar(self, size=200, bg_color=(52, 152, 219)):
        """Generate a simple default avatar (blue circle)"""
        # Create a new image with a white background
        img = Image.new('RGB', (size, size), color=(255, 255, 255))
        draw = ImageDraw.Draw(img)
        
        # Draw a colored circle
        margin = int(size * 0.1)
        draw.ellipse(
            [(margin, margin), (size - margin, size - margin)],
            fill=bg_color
        )
        
        # Draw a simple face (two eyes and a smile)
        eye_size = int(size * 0.1)
        left_eye_pos = (int(size * 0.35), int(size * 0.4))
        right_eye_pos = (int(size * 0.65), int(size * 0.4))
        
        # Draw eyes
        draw.ellipse(
            [(left_eye_pos[0] - eye_size//2, left_eye_pos[1] - eye_size//2),
             (left_eye_pos[0] + eye_size//2, left_eye_pos[1] + eye_size//2)],
            fill=(255, 255, 255)
        )
        draw.ellipse(
            [(right_eye_pos[0] - eye_size//2, right_eye_pos[1] - eye_size//2),
             (right_eye_pos[0] + eye_size//2, right_eye_pos[1] + eye_size//2)],
            fill=(255, 255, 255)
        )
        
        # Draw smile
        smile_start = (int(size * 0.3), int(size * 0.6))
        smile_end = (int(size * 0.7), int(size * 0.6))
        smile_control = (int(size * 0.5), int(size * 0.7))
        
        # Use a quadratic bezier curve for the smile
        points = []
        steps = 20
        for i in range(steps + 1):
            t = i / steps
            x = (1-t)**2 * smile_start[0] + 2*(1-t)*t*smile_control[0] + t**2*smile_end[0]
            y = (1-t)**2 * smile_start[1] + 2*(1-t)*t*smile_control[1] + t**2*smile_end[1]
            points.append((int(x), int(y)))
        
        # Draw the smile points
        for i in range(len(points) - 1):
            draw.line([points[i], points[i+1]], fill=(255, 255, 255), width=int(size * 0.03))
        
        return img