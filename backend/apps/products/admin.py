from django.contrib import admin
from .models import Category, Product, ProductImage, ProductAttributeValue, ProductAttribute

class ProductAttributeValueInline(admin.TabularInline):
    model = ProductAttributeValue
    extra = 1


@admin.register(ProductAttribute) 
class ProductAttributeAdmin(admin.ModelAdmin): 
    list_display = ("name", "slug", "value_type") 
    search_fields = ("name", "slug") 
    list_filter = ("value_type",) 
    prepopulated_fields = {"slug": ("name",)}

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('name',)}
    list_display = ('name', 'parent', 'is_active')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('name',)}
    list_display = ('name', 'price', 'stock', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)
    inlines = [ProductAttributeValueInline, ProductImageInline]

