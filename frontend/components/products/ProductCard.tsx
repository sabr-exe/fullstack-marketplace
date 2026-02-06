
import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, ChevronLeft, ChevronRight, ArrowRight, ShoppingCart } from 'lucide-react';
import { Product } from '../../types';
import { formatPrice, getImageUrl } from '../../utils/helpers';
import { Button } from '../ui/Button';

interface ProductCardProps {
  product: Product;
  badge?: 'New' | 'Sale' | 'Popular' | null;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, badge }) => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Swipe Logic States
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const isSwiping = useRef(false);
  const minSwipeDistance = 50;

  // Combine main image with other images for gallery
  const allImages = [
    product.main_image ? { image: product.main_image, id: -1 } : null,
    ...(product.images || [])
  ].filter(Boolean) as { image: string; id: number }[];

  // Fallback if no images
  const displayImages = allImages.length > 0 ? allImages : [{ image: '', id: 0 }];

  // Unique Display Images
  const uniqueDisplayImages = displayImages.filter((v,i,a)=>a.findIndex(t=>(t.image === v.image))===i);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? uniqueDisplayImages.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === uniqueDisplayImages.length - 1 ? 0 : prev + 1));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    isSwiping.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    isSwiping.current = true;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe || isRightSwipe) {
        // Confirm it was a horizontal swipe intended for navigation
        if (isLeftSwipe) {
           setCurrentImageIndex((prev) => (prev === uniqueDisplayImages.length - 1 ? 0 : prev + 1));
        }
        if (isRightSwipe) {
           setCurrentImageIndex((prev) => (prev === 0 ? uniqueDisplayImages.length - 1 : prev - 1));
        }
    } else {
        // If movement was small, consider it a tap, not a swipe
        isSwiping.current = false;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isSwiping.current && touchStart && touchEnd && Math.abs(touchStart - touchEnd) > minSwipeDistance) {
      e.preventDefault();
      e.stopPropagation();
      isSwiping.current = false; // Reset
    }
  };

  // Badge Logic
  let displayBadge = badge;
  let badgeColor = 'bg-blue-500';

  if (!displayBadge) {
    if (product.old_price) {
      displayBadge = 'Sale';
      badgeColor = 'bg-red-500';
    } else if (parseFloat(product.rating) >= 4.5) {
      displayBadge = 'Popular';
      badgeColor = 'bg-purple-500';
    } else {
       displayBadge = 'New';
       badgeColor = 'bg-green-500';
    }
  } else {
      if (badge === 'Sale') badgeColor = 'bg-red-500';
      if (badge === 'Popular') badgeColor = 'bg-purple-500';
      if (badge === 'New') badgeColor = 'bg-green-500';
  }

  return (
    <Link 
      to={`/products/${product.id}`} 
      onClick={handleClick}
      className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl shadow-sm md:shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col h-full group relative overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-xl select-none"
      draggable="false"
    >
      {/* Badge */}
      {displayBadge && (
        <div className={`absolute top-2 left-2 md:top-3 md:left-3 z-10 ${badgeColor} text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded shadow-md uppercase tracking-wide`}>
          {displayBadge}
        </div>
      )}

      {/* Image Container with Swipe Handlers */}
      <div 
        className="relative aspect-square bg-gray-100 dark:bg-gray-900 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img 
          src={getImageUrl(uniqueDisplayImages[currentImageIndex].image)} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          draggable="false"
        />
        
        {/* Rating */}
        {parseFloat(product.rating) > 0 && (
           <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1 shadow-sm z-10">
              <Star size={10} className="text-yellow-400 fill-current md:w-3 md:h-3" /> {product.rating}
           </div>
        )}

        {/* Swipe Controls (Desktop) */}
        {uniqueDisplayImages.length > 1 && (
            <>
                <button 
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/50 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-black text-gray-800 dark:text-white hidden md:block"
                >
                    <ChevronLeft size={16} />
                </button>
                <button 
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/50 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-black text-gray-800 dark:text-white hidden md:block"
                >
                    <ChevronRight size={16} />
                </button>
                
                {/* Dots */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {uniqueDisplayImages.map((_, idx) => (
                        <div key={idx} className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-primary' : 'bg-white/50'}`} />
                    ))}
                </div>
            </>
        )}
      </div>

      {/* Content */}
      <div className="p-2 md:p-4 flex flex-col flex-1 relative">
        <h3 className="font-medium text-xs md:text-base text-gray-900 dark:text-white truncate mb-1" title={product.name}>{product.name}</h3>
        <div className="mt-auto flex flex-col md:flex-row md:items-baseline justify-between mb-2 md:mb-4 gap-1">
          <span className="text-sm md:text-lg font-bold text-primary">{formatPrice(product.price)}</span>
          {product.old_price && (
            <span className="text-[10px] md:text-xs text-gray-400 line-through">{formatPrice(product.old_price)}</span>
          )}
        </div>
        
        {/* Compact Button for Mobile */}
        <Button 
            size="sm" 
            className="w-full gap-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:opacity-90 transition-opacity justify-center mt-auto text-[10px] md:text-sm px-2 py-1.5 md:px-4 md:py-2"
        >
            <span className="hidden md:inline">Shop Now</span>
            <span className="md:hidden">Buy</span>
            <ArrowRight size={12} className="md:w-4 md:h-4" />
        </Button>
      </div>
    </Link>
  );
};
