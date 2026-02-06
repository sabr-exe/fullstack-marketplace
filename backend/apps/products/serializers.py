from rest_framework import serializers
from .models import Category, Product, ProductImage, ProductAttribute, ProductAttributeValue



class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    

    class Meta:
        model = Category
        fields = (
            'id',
            'name',
            'slug',
            'parent',
            'children',
        )

    def get_children(self, obj):
        return CategorySerializer(
            obj.children.filter(is_active=True),
            many=True
        ).data



class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'is_main')



class ProductListSerializer(serializers.ModelSerializer):
    main_image = serializers.SerializerMethodField()
    reviews_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "price",
            "main_image",
            "reviews_count",
        )

    def get_main_image(self, obj):
        # если prefetch_related использован — obj.images.all() уже закэширован
        images = list(getattr(obj, "images").all()) if hasattr(obj, "images") else []
        if images:
            request = self.context.get("request")
            url = images[0].image.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return None


class ProductAttributeValueSerializer(serializers.ModelSerializer):
    attribute = serializers.CharField(source="attribute.name", read_only=True)
    slug = serializers.CharField(source="attribute.slug", read_only=True)
    value = serializers.SerializerMethodField()

    class Meta:
        model = ProductAttributeValue
        fields = ("attribute", "slug", "value")

    def get_value(self, obj):
        attr_type = obj.attribute.value_type

        if attr_type == ProductAttribute.TEXT:
            return obj.value_text

        if attr_type == ProductAttribute.NUMBER:
            return obj.value_number

        if attr_type == ProductAttribute.BOOLEAN:
            if obj.value_bool is True:
                return "yes"
            if obj.value_bool is False:
                return "no"
            return "unknown"

        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    rating = serializers.DecimalField(max_digits=3, decimal_places=1, read_only=True)
    reviews_count = serializers.IntegerField(read_only=True)
    attributes = ProductAttributeValueSerializer(many=True, read_only=True)
    class Meta:
        model = Product
        fields = (
            'id',
            'name',
            'slug',
            'description',
            'price',
            'old_price',
            'stock',
            'images',
            'rating',
            'reviews_count',
            'attributes',
        )




