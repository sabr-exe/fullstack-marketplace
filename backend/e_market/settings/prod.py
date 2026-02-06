from .base import *
import os
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
# Database (Postgres через DATABASE_URL)
import dj_database_url

SENTRY_DSN = os.environ.get("SENTRY_DSN")

if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],

        # performance / tracing
        traces_sample_rate=0.1,   # 10% запросов
        send_default_pii=False,   # НЕ слать персональные данные

        environment="production",
        release=os.environ.get("RELEASE", "unknown"),
    )

DATABASES = {
    "default": dj_database_url.config(conn_max_age=600, ssl_require=True)
}

DEBUG = False

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError(
        "DJANGO_SECRET_KEY environment variable is not set. "
        "Refusing to start in production."
    )



ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "").split(",")

# Security
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

SECURE_HSTS_SECONDS = 3600
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

X_FRAME_OPTIONS = "DENY"


DATABASES = {
    "default": dj_database_url.config(conn_max_age=600, ssl_require=True)
}

# Static
STATIC_ROOT = BASE_DIR / "staticfiles"

# Logging (минимальный прод уровень)
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,

    "formatters": {
        "simple": {
            "format": "%(levelname)s %(asctime)s %(name)s %(message)s"
        },
        "structured": {
            "format": (
                '{"level": "%(levelname)s", '
                '"time": "%(asctime)s", '
                '"logger": "%(name)s", '
                '"message": "%(message)s"}'
            )
        },
    },

    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "structured",   # ВАЖНО: structured в проде
        },
    },

    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },

    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "django.request": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
    },
}



INTERNAL_IPS = ["127.0.0.1"]


CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.environ.get("REDIS_URL", "redis://127.0.0.1:6379/1"),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
        "TIMEOUT": 300,
    }
}
