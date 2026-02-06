from django.core.exceptions import ValidationError

def validate_image_size(image):
    max_size = 5 * 1024 * 1024  # 5MB
    if image.size > max_size:
        raise ValidationError("Image too large (max 5MB)")

def validate_image_mime(image):
    if image.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise ValidationError("Only JPG, PNG, WEBP allowed")
