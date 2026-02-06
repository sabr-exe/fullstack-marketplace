
import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Star, ShoppingCart, Truck, RefreshCw, Send, Lock } from 'lucide-react';
import api from '../api/client';
import { Product, Review, PaginatedResponse } from '../types';
import { Button } from '../components/ui/Button';
import { formatPrice, getImageUrl } from '../utils/helpers';
import { useAuthStore } from '../store/auth.store';
import { showRopeError } from '../components/ui/RopeError';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Review Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => (await api.get(`/products/${id}/`)).data,
  });

  const { data: reviews } = useQuery<PaginatedResponse<Review>>({
    queryKey: ['reviews', id],
    queryFn: async () => (await api.get(`/products/${id}/reviews/`)).data,
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await api.post('/cart/add/', { product_id: id, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart!');
    },
    onError: (err: any) => {
        toast.error(err.response?.data?.quantity?.[0] || 'Failed to add to cart');
    }
  });

    const addReviewMutation = useMutation({
    mutationFn: async () => {
        if (!isAuthenticated) throw new Error("Unauthorized");

        //console.log("Review product id:", id);  //

        return api.post(`/products/${id}/reviews/`, {
        rating,
        text: comment,
        });
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['reviews', id] });
        queryClient.invalidateQueries({ queryKey: ['product', id] }); // Refresh rating
        toast.success('Review submitted successfully!');
        setComment('');
        setRating(5);
    },
    onError: (err: any) => {
        if (!isAuthenticated) {
            showRopeError("You must be logged in to write a review.");
        } else {
            const errorMsg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || err.message || "Failed to submit review.";
            // Handle specific backend validation (e.g., "You must purchase this product")
            if (errorMsg.includes("purchase") || err.response?.status === 403) {
                 showRopeError("You must purchase this product to leave a review.");
            } else {
                 showRopeError(errorMsg);
            }
        }
    }
  });

  const handleAddToCart = () => {
    if (!isAuthenticated) {
        toast.error('Please login to add items to cart');
        navigate('/login', { state: { from: location } });
        return;
    }
    addToCartMutation.mutate();
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!isAuthenticated) {
          showRopeError("You must be logged in to write a review.");
          return;
      }
      addReviewMutation.mutate();
  };

  if (isLoading || !product) return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  const currentImage = selectedImage || (product.images.find(img => img.is_main)?.image || product.images[0]?.image);

  return (
    <div className="space-y-12 px-4">
      {/* Product Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Gallery */}
        <div className="space-y-4">
            <div className="aspect-square bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
                <img src={getImageUrl(currentImage)} alt={product.name} className="w-full h-full object-contain" />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
                {product.images.map((img) => (
                    <button 
                        key={img.id} 
                        onClick={() => setSelectedImage(img.image)}
                        className={`w-20 h-20 rounded-md overflow-hidden border-2 flex-shrink-0 ${selectedImage === img.image ? 'border-primary' : 'border-transparent'}`}
                    >
                        <img src={getImageUrl(img.image)} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                    <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={16} fill={i < Math.round(parseFloat(product.rating)) ? "currentColor" : "none"} />
                        ))}
                    </div>
                    <span className="text-gray-500 text-sm">({product.reviews_count} reviews)</span>
                </div>
            </div>

            <div className="text-4xl font-bold text-primary">
                {formatPrice(product.price)}
                {product.old_price && <span className="text-xl text-gray-400 line-through ml-4">{formatPrice(product.old_price)}</span>}
            </div>

            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {product.description}
            </p>

            {/* Attributes */}
            {product.attributes.length > 0 && (
                <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-200 dark:border-gray-700 py-4">
                    {product.attributes.map((attr, idx) => (
                        <div key={idx} className="flex justify-between">
                            <span className="text-gray-500 font-medium">{attr.attribute}:</span>
                            <span className="text-gray-900 dark:text-white">{String(attr.value)}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Stock & Cart */}
            <div className="space-y-4 pt-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
                        <button className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                        <span className="px-4 py-2 font-medium dark:text-white">{quantity}</span>
                        <button className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
                    </div>
                    <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-danger'}`}>
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                    </span>
                </div>

                <Button 
                    size="lg" 
                    className="w-full gap-2" 
                    disabled={product.stock === 0}
                    onClick={handleAddToCart}
                    isLoading={addToCartMutation.isPending}
                >
                    <ShoppingCart size={20} /> Add to Cart
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2"><Truck size={16}/> Fast Delivery</div>
                <div className="flex items-center gap-2"><RefreshCw size={16}/> Free Returns</div>
            </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="pt-12 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 dark:text-white">Customer Reviews</h2>
        
        {/* Add Review Form */}
        <div className="mb-10 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Write a Review</h3>
            {isAuthenticated ? (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button 
                                    key={star} 
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star 
                                        size={24} 
                                        className={star <= rating ? "text-yellow-400 fill-current" : "text-gray-300 dark:text-gray-600"} 
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Review</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white resize-none"
                            placeholder="Share your thoughts about this product..."
                            required
                        />
                    </div>
                    <Button type="submit" isLoading={addReviewMutation.isPending} className="gap-2">
                        <Send size={16} /> Submit Review
                    </Button>
                </form>
            ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Lock className="text-gray-400 mb-2" size={32} />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Please log in to write a review.</p>
                    <Button variant="outline" onClick={() => navigate('/login', { state: { from: location } })}>
                        Login to write a review
                    </Button>
                </div>
            )}
        </div>

        {/* Reviews List */}
        <div className="grid gap-6">
            {!reviews || reviews.results.length === 0 ? (
                <p className="text-gray-500 italic">No reviews yet. Be the first to review this product!</p>
            ) : (
                reviews.results.map((review: Review) => (
                <div key={review.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            <div className="font-semibold dark:text-white">{review.user_email}</div>
                            <span className="text-gray-400 text-sm">{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} />
                            ))}
                        </div>
                    </div>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">{review.text}</p>
                </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
