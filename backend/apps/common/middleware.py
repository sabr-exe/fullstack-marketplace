import uuid
import hashlib
from sentry_sdk import set_user, set_tag

class SentryUserMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Генерация уникального request_id
        request_id = str(uuid.uuid4())
        request.request_id = request_id
        set_tag("request_id", request_id)

        # Установка пользователя в Sentry
        if hasattr(request, "user") and request.user.is_authenticated:
            email = request.user.email # or ""
            email_hash = hashlib.sha256(email.encode()).hexdigest()
            set_user({
                "id": request.user.id,
                "email": email_hash,
            })
        else:
            set_user(None)

        response = self.get_response(request)

        # Проброс request_id в заголовок
        response["X-Request-ID"] = request_id

        return response
