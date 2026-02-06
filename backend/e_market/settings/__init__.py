import os

DJANGO_ENV = os.getenv("DJANGO_ENV", "dev")

if DJANGO_ENV == "prod":
    from .prod import *
elif DJANGO_ENV == "dev":
    from .dev import *
else:
    raise RuntimeError(f"Unknown DJANGO_ENV: {DJANGO_ENV}")
