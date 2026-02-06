from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
import os
from django.conf import settings

from django.http import HttpResponseForbidden


def internal_only(view_func):
    def wrapper(request, *args, **kwargs):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0].strip()
        else:
            ip = request.META.get("REMOTE_ADDR")

        if ip not in settings.INTERNAL_IPS:
            return HttpResponseForbidden()
        return view_func(request, *args, **kwargs)
    return wrapper


def healthcheck(request):
    """
    Liveness probe — просто проверяем, что Django жив
    """
    return JsonResponse({"status": "ok"})


@internal_only
def readiness(request):
    """
    Readiness probe — проверяем зависимости:
    - БД
    - Cache (если есть)
    """

    # Проверка базы
    try:
        connection.ensure_connection()
        db_status = "ok"
    except Exception:
        db_status = "error"

    # Проверка cache (redis / memcached)
    try:
        cache.set("healthcheck", "ok", timeout=1)
        cache_status = "ok"
    except Exception:
        cache_status = "error"

    status = "ok" if db_status == "ok" and cache_status == "ok" else "error"

    return JsonResponse(
        {
            "status": status,
            "database": db_status,
            "cache": cache_status,
        },
        status=200 if status == "ok" else 500,
    )




def version(request):
    return JsonResponse(
        {
            "service": "e_market",  #e_market.
            "environment": os.environ.get("DJANGO_ENV", "dev"),
            "version": os.environ.get("APP_VERSION", "unknown"),
            "debug": settings.DEBUG,
        }
    )
