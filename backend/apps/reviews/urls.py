from rest_framework.routers import SimpleRouter
from .views import ReviewViewSet



router = SimpleRouter()
router.register(
    'products/(?P<product_id>[^/.]+)/reviews',
    ReviewViewSet,
    basename='apps.reviews'
)

urlpatterns = router.urls
