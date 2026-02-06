from rest_framework.throttling import SimpleRateThrottle


class RegisterRateThrottle(SimpleRateThrottle):
    scope = "register"

    def get_cache_key(self, request, view):
        # Ограничиваем по IP
        ip = self.get_ident(request)
        return self.cache_format % {
            "scope": self.scope,
            "ident": ip,
        }
