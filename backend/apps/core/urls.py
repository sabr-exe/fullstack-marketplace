from django.urls import path
from .views import healthcheck, readiness, version



urlpatterns = [
    path("health/", healthcheck, name="healthcheck"),
    path("ready/", readiness, name="readiness"),
    path("version/", version, name="version"),

]
