from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.validators import validate_email

from .models import User
from datetime import date


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            "email",
            "password",
            "first_name",
            "last_name",
            "birth_date",
            "gender",
        )

    def validate_email(self, value): 
        value = value.lower() 
        # Проверка формата email 
        try: 
            validate_email(value) 
        except Exception: 
            raise serializers.ValidationError("Invalid email format") 
        # Проверка уникальности 
        if User.objects.filter(email=value).exists(): 
            raise serializers.ValidationError("User with this email already exists") 
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_birth_date(self, value):
        # Минимальный возраст: 12 лет (можно поменять)
        today = date.today()
        age = today.year - value.year - (
            (today.month, today.day) < (value.month, value.day)
        )

        if age < 12:
            raise serializers.ValidationError("You must be at least 12 years old")

        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            birth_date=validated_data.get("birth_date"),
            gender=validated_data.get("gender", ""),
            is_active=True,
            is_email_verified=True,   # сразу активный
        )

        return user
