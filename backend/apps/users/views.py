from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import AnonRateThrottle
from .throttles import RegisterRateThrottle
from .serializers import RegisterSerializer


class RegisterView(APIView):
    throttle_classes = [AnonRateThrottle, RegisterRateThrottle]


    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_email_verified": user.is_email_verified,
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(
            {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "age": user.age,
                "birth_date": user.birth_date,
                "gender": user.gender,
                "is_staff": user.is_staff,
                "is_email_verified": user.is_email_verified,
            }
        )
    def patch(self, request):
        user = request.user

        user.first_name = request.data.get("first_name", user.first_name)
        user.last_name = request.data.get("last_name", user.last_name)

        user.save(update_fields=["first_name", "last_name"])

        return Response(
            {
                "message": "Profile updated",
                "first_name": user.first_name,
                "last_name": user.last_name,
            }
        )
