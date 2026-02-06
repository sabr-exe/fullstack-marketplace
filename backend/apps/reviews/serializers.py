from rest_framework import serializers
from .models import Review



class ReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(
        source='user.email',
        read_only=True
    )

    class Meta:
        model = Review
        fields = (
            'id',
            'rating',
            'text',
            'user_email',
            'created_at',
        )
        read_only_fields = ('id', 'created_at', 'user_email', 'product')
