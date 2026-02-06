
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { ArrowRight, ShoppingBag, Truck, ShieldCheck, ChevronRight, Star, Zap, Smartphone, Shirt, Home, Dumbbell, Gamepad2, Sparkles, Layers } from 'lucide-react';
import api from '../api/client';
import { Category, PaginatedResponse, Product } from '../types';
import { ProductCard } from '../components/products/ProductCard';

const HERO_SLIDES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    title: "Summer Collection 2024",
    description: "Discover the latest trends in fashion and electronics.",
    link: "/products?category=fashion"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80",
    title: "Tech Revolution",
    description: "Upgrade your life with next-gen gadgets.",
    link: "/products?category=electronics"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
    title: "Modern Living",
    description: "Furniture and decor to transform your home.",
    link: "/products?category=home"
  }
];

const SELECTION_VARIANTS = [
    { title: "Wide Selection", desc: "Thousands of products available." },
    { title: "Huge Variety", desc: "Items for every need and taste." },
    { title: "Massive Catalog", desc: "Explore our endless collection." }
];

const DELIVERY_VARIANTS = [
    { title: "Fast Delivery", desc: "Get your order in 24-48 hours." },
    { title: "Quick Shipping", desc: "Dispatched within same day." },
    { title: "Express Logistics", desc: "Track your package in real-time." }
];

const PAYMENT_VARIANTS = [
    { title: "Secure Payment", desc: "100% secure payment processing." },
    { title: "Safe Checkout", desc: "Encrypted transactions guaranteed." },
    { title: "Protected Transactions", desc: "Your financial data is safe." }
];

// Helper to get category icon
const getCategoryIcon = (slug: string) => {
  switch (slug) {
    case 'electronics': return <Smartphone size={20} />;
    case 'fashion': return <Shirt size={20} />;
    case 'home-garden': return <Home size={20} />;
    case 'sports': return <Dumbbell size={20} />;
    case 'toys': return <Gamepad2 size={20} />;
    case 'beauty': return <Sparkles size={20} />;
    default: return <Layers size={20} />;
  }
};

// Helper Component for Home Sections
const HomeProductSection: React.FC<{ title: string; queryParams: string; icon?: React.ReactNode; badgeType?: 'New' | 'Sale' | 'Popular' }> = ({ title, queryParams, icon, badgeType }) => {
    const { data, isLoading } = useQuery<PaginatedResponse<Product>>({
        queryKey: ['home-products-section', title, queryParams],
        queryFn: async () => (await api.get(`/products/?${queryParams}&page_size=5`)).data, // Limit 5 items
    });

    const displayProducts = data?.results || [];
    
    if (isLoading && !displayProducts.length) return <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse my-6"></div>;
    
    // Optional: Hide section if no products
    if (!isLoading && displayProducts.length === 0) return null;

    return (
        <section className="mb-12">
             <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {icon} {title}
                </h3>
                <Link to={`/products?${queryParams}`} className="text-primary font-medium hover:underline flex items-center gap-1 text-sm md:text-base">
                    See All <ChevronRight size={16}/>
                </Link>
             </div>
             {/* Horizontal Scroll Container */}
             <div className="flex overflow-x-auto gap-3 md:gap-6 pb-6 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {displayProducts.map(product => (
                    <div key={product.id} className="min-w-[150px] w-[150px] md:min-w-[280px] md:w-[280px] snap-start">
                        <ProductCard product={product} badge={badgeType} />
                    </div>
                ))}
             </div>
        </section>
    );
};

const HomePage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectionIdx, setSelectionIdx] = useState(0);
  const [deliveryIdx, setDeliveryIdx] = useState(0);
  const [paymentIdx, setPaymentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
      const t1 = setInterval(() => setSelectionIdx(i => (i + 1) % SELECTION_VARIANTS.length), 4000);
      const t2 = setInterval(() => setDeliveryIdx(i => (i + 1) % DELIVERY_VARIANTS.length), 5500);
      const t3 = setInterval(() => setPaymentIdx(i => (i + 1) % PAYMENT_VARIANTS.length), 7000);
      return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); };
  }, []);

  // Corrected Type: CategoryViewSet returns PaginatedResponse
  const { data: categories } = useQuery<PaginatedResponse<Category>>({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories/')).data,
  });

  // Access .results safely
  const displayCategories = categories?.results ? categories.results.slice(0, 6) : [];

  return (
    <div className="space-y-16 px-4 sm:px-0 pb-12">
      {/* Hero Carousel */}
      <section className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-xl h-[300px] md:h-[500px]">
        {HERO_SLIDES.map((slide, index) => (
          <div 
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="absolute inset-0 bg-black/40 z-10" />
            <img 
              src={slide.image} 
              alt={slide.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl animate-fade-in-up drop-shadow-lg">
                {slide.title}
              </h1>
              <p className="mt-4 md:mt-6 text-sm md:text-xl text-gray-200 max-w-3xl drop-shadow-md">
                {slide.description}
              </p>
              <div className="mt-6 md:mt-10">
                <Link to={slide.link}>
                  <Button 
                    size="md" 
                    className="relative z-50 gap-2 bg-white text-gray-900 font-bold hover:bg-gray-100 border-none transition-transform hover:scale-105 shadow-xl opacity-100 visible text-xs md:text-base"
                    style={{ opacity: 1, visibility: 'visible', color: '#111827', backgroundColor: '#ffffff' }} 
                  >
                    Shop Now <ArrowRight size={16} className="md:w-5 md:h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex space-x-2">
          {HERO_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-colors shadow-sm ${index === currentSlide ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'}`}
            />
          ))}
        </div>
      </section>

      {/* Categories */}
      {displayCategories.length > 0 && (
        <section>
            <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Shop by Category</h2>
            <Link to="/products" className="text-primary hover:text-secondary flex items-center text-sm font-medium">
                View All <ChevronRight size={16} />
            </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {displayCategories.map((category) => (
                <Link 
                key={category.id} 
                to={`/products?category=${category.slug}`}
                className="flex items-center justify-center gap-2 bg-primary text-white px-3 py-3 md:px-4 md:py-4 rounded-lg hover:bg-secondary transition-all shadow-md hover:shadow-lg font-medium transform hover:-translate-y-0.5 text-center h-full text-sm md:text-base"
                >
                {getCategoryIcon(category.slug)}
                <span className="truncate w-full">{category.name}</span>
                </Link>
            ))}
            </div>
        </section>
      )}
    
      <HomeProductSection 
        title="Recommended" 
        queryParams="ordering=-id" 
        badgeType="New"
        icon={<div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">R</div>} 
      />

      <HomeProductSection 
        title="Popular Products" 
        queryParams="ordering=-rating" 
        badgeType="Popular"
        icon={<Star size={24} className="text-purple-500 fill-current" />} 
      />

      <HomeProductSection 
        title="On Sale" 
        queryParams="ordering=price" 
        badgeType="Sale"
        icon={<span className="text-red-500 text-2xl font-extrabold">%</span>} 
      />

      <HomeProductSection 
        title="New Products" 
        queryParams="ordering=-created_at" 
        badgeType="New"
        icon={<Zap size={24} className="text-yellow-500 fill-current" />} 
      />

      {/* Rotating Features */}
      <section className="border-t border-gray-200 dark:border-gray-700 pt-12 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 md:p-8 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                 <div className="p-3 md:p-4 rounded-full mb-3 md:mb-6 text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30">
                    <ShoppingBag className="w-6 h-6 md:w-10 md:h-10" />
                 </div>
                 <div className="h-16 md:h-24 flex flex-col justify-center w-full">
                     <h3 className="text-base md:text-xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2 animate-fade-in-up">
                        {SELECTION_VARIANTS[selectionIdx].title}
                     </h3>
                     <p className="text-xs md:text-base text-gray-500 dark:text-gray-400 animate-fade-in-up">
                        {SELECTION_VARIANTS[selectionIdx].desc}
                     </p>
                 </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 md:p-8 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                 <div className="p-3 md:p-4 rounded-full mb-3 md:mb-6 text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/30">
                    <Truck className="w-6 h-6 md:w-10 md:h-10" />
                 </div>
                 <div className="h-16 md:h-24 flex flex-col justify-center w-full">
                     <h3 className="text-base md:text-xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2 animate-fade-in-up">
                        {DELIVERY_VARIANTS[deliveryIdx].title}
                     </h3>
                     <p className="text-xs md:text-base text-gray-500 dark:text-gray-400 animate-fade-in-up">
                        {DELIVERY_VARIANTS[deliveryIdx].desc}
                     </p>
                 </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 md:p-8 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                 <div className="p-3 md:p-4 rounded-full mb-3 md:mb-6 text-purple-600 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30">
                    <ShieldCheck className="w-6 h-6 md:w-10 md:h-10" />
                 </div>
                 <div className="h-16 md:h-24 flex flex-col justify-center w-full">
                     <h3 className="text-base md:text-xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2 animate-fade-in-up">
                        {PAYMENT_VARIANTS[paymentIdx].title}
                     </h3>
                     <p className="text-xs md:text-base text-gray-500 dark:text-gray-400 animate-fade-in-up">
                        {PAYMENT_VARIANTS[paymentIdx].desc}
                     </p>
                 </div>
            </div>
        </div>
      </section>
      <style>{`
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fadeInUp 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
