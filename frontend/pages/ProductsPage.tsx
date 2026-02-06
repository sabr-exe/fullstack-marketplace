
import React, { useState } from 'react';
import { useQuery, keepPreviousData  } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, SlidersHorizontal, X, ChevronRight, Flame, Star, Zap, Percent, Check } from 'lucide-react';
import api from '../api/client';
import { PaginatedResponse, Product, Category } from '../types';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useDebounce } from 'use-debounce';
import { ProductCard } from '../components/products/ProductCard';

const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('search') || '';
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [ordering, setOrdering] = useState(searchParams.get('ordering') || '');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Fetch Categories - Fixed type to PaginatedResponse
  const { data: categories } = useQuery<PaginatedResponse<Category>>({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories/')).data,
  });

  // Fetch Products (limit 15)
  

const { data: productsData, isLoading, isFetching } = useQuery<PaginatedResponse<Product>>({
  queryKey: ['products', page, debouncedSearch, selectedCategory, minPrice, maxPrice, ordering],
  queryFn: async () => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', '16');
    if (debouncedSearch) params.append('search', debouncedSearch);
    if (selectedCategory) params.append('category', selectedCategory);
    if (minPrice) params.append('min_price', minPrice);
    if (maxPrice) params.append('max_price', maxPrice);
    if (ordering) params.append('ordering', ordering);

    return (await api.get(`/products/?${params.toString()}`)).data;
  },
  placeholderData: keepPreviousData,
});


  // const { data: productsData, isLoading } = useQuery<PaginatedResponse<Product>>({

  //   queryKey: ['products', page, debouncedSearch, selectedCategory, minPrice, maxPrice, ordering],
  //   queryFn: async () => {
  //     const params = new URLSearchParams();
  //     params.append('page', page.toString());
  //     params.append('page_size', '16'); // Requirement: 15 items per page
  //     if (debouncedSearch) params.append('search', debouncedSearch);
  //     if (selectedCategory) params.append('category', selectedCategory);
  //     if (minPrice) params.append('min_price', minPrice);
  //     if (maxPrice) params.append('max_price', maxPrice);
  //     if (ordering) params.append('ordering', ordering);
      
  //     const { data } = await api.get(`/products/?${params.toString()}`);
  //     return data;
  //   },
  // });

  const handleFilter = () => {
    setPage(1);
    const params: any = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (selectedCategory) params.category = selectedCategory;
    if (minPrice) params.min_price = minPrice;
    if (maxPrice) params.max_price = maxPrice;
    if (ordering) params.ordering = ordering;
    setSearchParams(params);
    setIsFiltersOpen(false);
  };

  const QuickLink = ({ label, sortVal, type }: { label: string, sortVal: string, type?: 'popular' | 'new' | 'sale' | 'recommended' | 'default' }) => {
    const isActive = ordering === sortVal;
    
    // Updated base classes for mobile compactness
    let baseClasses = "relative px-3 py-1.5 md:px-6 md:py-3 rounded-lg md:rounded-full font-bold tracking-wide transition-all duration-300 text-xs md:text-sm min-w-0 md:min-w-[160px] text-center overflow-hidden group flex items-center justify-center gap-1.5 md:gap-2 border shadow-sm hover:shadow-md flex-shrink-0";
    let activeClasses = "";
    let inactiveClasses = "";
    let icon = null;

    // Adjusted icon sizes for mobile
    const iconSize = typeof window !== 'undefined' && window.innerWidth < 768 ? 14 : 18;

    switch (type) {
        case 'popular':
            icon = <Flame size={iconSize} className={isActive ? "animate-pulse fill-current" : "group-hover:text-orange-500"} />;
            activeClasses = "bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white shadow-red-500/30 border-transparent scale-105";
            inactiveClasses = "bg-white dark:bg-gray-800 text-orange-600 border-orange-200 dark:border-orange-900/50 hover:bg-orange-50 dark:hover:bg-gray-700";
            break;
        case 'new':
            icon = <Zap size={iconSize} className={isActive ? "fill-current" : "group-hover:text-blue-500"} />;
            activeClasses = "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-blue-500/30 border-transparent scale-105 ring-1 md:ring-2 ring-blue-400 ring-offset-1 md:ring-offset-2 dark:ring-offset-gray-900";
            inactiveClasses = "bg-white dark:bg-gray-800 text-blue-600 border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-gray-700";
            break;
        case 'sale':
            icon = <Percent size={iconSize - 2} className={isActive ? "animate-bounce" : ""} />;
            activeClasses = "bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-red-500/30 border-transparent scale-105";
            inactiveClasses = "bg-white dark:bg-gray-800 text-red-600 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-gray-700";
            break;
        case 'recommended':
            icon = <Star size={iconSize} className={isActive ? "fill-current" : "group-hover:text-yellow-500"} />;
            activeClasses = "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-yellow-500/30 border-transparent scale-105";
            inactiveClasses = "bg-white dark:bg-gray-800 text-yellow-600 border-yellow-200 dark:border-yellow-900/50 hover:bg-yellow-50 dark:hover:bg-gray-700";
            break;
        default:
            icon = isActive ? <Check size={iconSize} /> : null;
            activeClasses = "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-lg scale-105";
            inactiveClasses = "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary";
    }

    return (
        <button 
            onClick={() => { setOrdering(sortVal); setPage(1); }}
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
            {icon}
            {label}
        </button>
    );
  };

  return (
    <div className="px-4 py-8 mx-auto w-full">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-4">
            <Button variant="outline" className="w-full flex justify-between items-center" onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
                <span className="flex items-center gap-2"><Filter size={18}/> Filters</span>
                {isFiltersOpen ? <X size={18}/> : <ChevronRight size={18} className="rotate-90" />}
            </Button>
        </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start relative">
        {/* Filters Sidebar - Expanded Width, Shifted Left by ~1cm (approx -2.5rem/-10) on LG */}
        <aside className={`
            w-full lg:w-96 lg:-ml-10 space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl 
            border border-gray-100 dark:border-gray-700 transition-all duration-300 z-30
            ${isFiltersOpen ? 'block' : 'hidden lg:block'}
            lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto
        `}>
          <div className="flex items-center justify-between font-bold text-xl text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
             <div className="flex items-center gap-2"><Filter size={20} /> Filters</div>
             <button className="lg:hidden text-gray-500" onClick={() => setIsFiltersOpen(false)}><X size={20}/></button>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3 dark:text-gray-200">Category</h3>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2.5 border rounded-lg bg-white text-gray-900 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-primary shadow-sm"
            >
              <option value="">All Categories</option>
              {categories?.results?.map((cat) => (
                <React.Fragment key={cat.id}>
                  <option value={cat.slug} className="font-bold">{cat.name}</option>
                  {cat.children.map(child => (
                     <option key={child.id} value={child.slug}>&nbsp;&nbsp;{child.name}</option>
                  ))}
                </React.Fragment>
              ))}
            </select>
          </div>

          <div>
             <h3 className="font-semibold mb-3 dark:text-gray-200">Price Range</h3>
             <div className="grid grid-cols-2 gap-2">
               <Input placeholder="Min" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
               <Input placeholder="Max" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
             </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 dark:text-gray-200">Sort By</h3>
             <select 
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="w-full p-2.5 border rounded-lg bg-white text-gray-900 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-primary shadow-sm"
            >
              <option value="">Relevance</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="-created_at">Newest Arrivals</option>
              <option value="-rating">Top Rated</option>
            </select>
          </div>

          <Button onClick={handleFilter} className="w-full gap-2 shadow-md hover:shadow-lg">
            <SlidersHorizontal size={16} /> Apply Filters
          </Button>
        </aside>

        {/* Main Content */}
        <div className="flex-1 w-full min-w-0">
          {/* Centered Mini Links Sections - Responsive Compact Style */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-6 md:mb-8 pb-4 md:pb-6 border-b border-gray-200 dark:border-gray-700 sticky top-16 bg-gray-50 dark:bg-gray-900 z-40 py-3 md:py-4 -mx-4 px-4 shadow-sm md:static md:shadow-none md:bg-transparent md:top-0 md:px-0 md:mx-0">
              <QuickLink label="All" sortVal="" type="default" />
              <QuickLink label="Rec." sortVal="-id" type="recommended" />
              <QuickLink label="Popular" sortVal="-rating" type="popular" />
              <QuickLink label="New" sortVal="-created_at" type="new" />
              <QuickLink label="Sale" sortVal="price" type="sale" />
          </div>

          <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-200 dark:border-gray-700">
             <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                {ordering === '-id' ? 'Recommended' :
                 ordering === '-rating' ? 'Popular Products' :
                 ordering === '-created_at' ? 'New Products' :
                 ordering === 'price' ? 'On Sale' : 'All Products'}
            </h2>
            <span className="text-sm text-gray-500 font-medium">{productsData?.count || 0} items found</span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-6 justify-items-center">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 dark:bg-gray-700 h-64 md:h-96 w-full max-w-[340px] rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : productsData?.results.length === 0 ? (
             <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700">
                <Search size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
                <Button variant="ghost" onClick={() => {
                  setSearchParams({});
                  setSelectedCategory('');
                  setMinPrice('');
                  setMaxPrice('');
                  setOrdering('');
                }} className="mt-4 text-primary">Clear all filters</Button>
             </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-6 justify-items-center">
              {productsData?.results.map((product) => (
                <div key={product.id} className="w-full max-w-[340px]">
                    <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {productsData && productsData.count > 0 && (
             <div className="mt-12 flex justify-center gap-2 items-center">
                <Button 
                  disabled={!productsData.previous} 
                  onClick={() => {
                    setPage(p => p - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  variant="outline"
                  size="sm"
                  className="shadow-sm min-w-[100px]"
                >
                  Previous
                </Button>
                <span className="flex items-center px-6 font-bold dark:text-white bg-white dark:bg-gray-800 py-2 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
                  {page}
                </span>
                <Button 
                  disabled={!productsData.next} 
                  onClick={() => {
                    setPage(p => p + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  variant="outline"
                  size="sm"
                  className="shadow-sm min-w-[100px]"
                >
                  Next
                </Button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
