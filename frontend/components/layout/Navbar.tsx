
import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingCart, User, Sun, Moon, Menu, X, Package, ShoppingBag, Search, Grid, LogIn, UserPlus } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { Cart } from '../../types';

export const Navbar: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [animState, setAnimState] = useState<{ active: boolean; side: 'left' | 'right'; type: 'sun' | 'moon' }>({ 
    active: false, 
    side: 'left',
    type: 'sun'
  });

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  useEffect(() => {
    if (isMobileSearchOpen && searchInputRef.current) {
        searchInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  useEffect(() => {
    const handleScroll = () => {
        if (isMenuOpen) {
            setIsMenuOpen(false);
        }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMenuOpen]);

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setAnimState({ active: true, side: 'right', type: 'moon' });
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setAnimState({ active: true, side: 'left', type: 'sun' });
    }
    
    setIsDark(newIsDark);
    if (isMenuOpen) setIsMenuOpen(false);
    setTimeout(() => {
        setAnimState(prev => ({ ...prev, active: false }));
    }, 2000);
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsMenuOpen(false);
    setIsMobileSearchOpen(false);
    navigate(`/products?search=${searchTerm}`);
  };

  const { data: cart } = useQuery<Cart>({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await api.get('/cart/');
      return data;
    },
    enabled: isAuthenticated,
  });

  const cartCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <>
    <style>{`
      @keyframes celestialDrop {
        0% { transform: translateY(-100px); opacity: 0; }
        50% { transform: translateY(60px) rotate(180deg); opacity: 1; }
        100% { transform: translateY(20px) rotate(360deg); opacity: 0; }
      }
      .animate-celestial-drop {
        animation: celestialDrop 1.5s ease-in-out forwards;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in {
        animation: fadeIn 0.2s ease-out forwards;
      }
    `}</style>
    
    {animState.active && (
        <div 
            className={`fixed top-4 z-[100] pointer-events-none animate-celestial-drop`}
            style={{ [animState.side]: '5%' }}
        >
            {animState.type === 'sun' ? (
                 <Sun size={64} className="text-yellow-500 fill-yellow-400 drop-shadow-xl" />
            ) : (
                 <Moon size={64} className="text-blue-300 fill-blue-200 drop-shadow-xl" />
            )}
        </div>
    )}

    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-200 shadow-sm h-16">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full gap-2 sm:gap-4">
          
          {isMobileSearchOpen ? (
             <div className="absolute inset-0 bg-white dark:bg-gray-900 z-50 flex items-center px-4 gap-3 animate-fade-in">
                <Search className="text-gray-400 flex-shrink-0" size={20} />
                <form onSubmit={handleSearch} className="flex-1">
                    <input
                        ref={searchInputRef}
                        type="text"
                        className="w-full bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-500 text-lg"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </form>
                <button 
                    onClick={() => setIsMobileSearchOpen(false)} 
                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
                >
                    Cancel
                </button>
             </div>
          ) : (
             <>
                {/* Logo */}
                <div className="flex items-center gap-6">
                    <Link to="/" className="flex items-center space-x-2 group flex-shrink-0 bg-primary text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-secondary transition-all shadow-md hover:shadow-lg font-medium transform hover:-translate-y-0.5">
                    <ShoppingBag size={20} strokeWidth={2.5} />
                    <span className="hidden sm:block text-lg font-bold">
                        E-Market
                    </span>
                    </Link>
                </div>

                {/* Desktop Search */}
                <div className="hidden md:block flex-1 max-w-3xl mx-4">
                    <form onSubmit={handleSearch} className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-full leading-5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all shadow-inner"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    </form>
                </div>

                {/* Desktop Right Actions */}
                <div className="hidden md:flex items-center space-x-4">
                    <Link 
                        to="/products" 
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition-all shadow-md hover:shadow-lg font-medium transform hover:-translate-y-0.5"
                    >
                        <Grid size={18} /> Products
                    </Link>

                    {isAuthenticated ? (
                    <div className="relative group">
                        <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition-all shadow-md hover:shadow-lg font-medium transform hover:-translate-y-0.5">
                            <User size={18} />
                            <span className="max-w-[100px] truncate">{user?.first_name || 'Account'}</span>
                        </button>
                        <div className="absolute right-0 w-48 mt-2 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Signed in as</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.email}</p>
                            </div>
                            <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Profile</Link>
                            <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">My Orders</Link>
                            <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-danger hover:bg-gray-50 dark:hover:bg-gray-700">Logout</button>
                        </div>
                    </div>
                    ) : (
                    <div className="flex items-center space-x-2">
                        <Link to="/login" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary font-medium px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <LogIn size={18} /> Login
                        </Link>
                        <Link to="/register" className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition-all shadow-md hover:shadow-lg font-medium transform hover:-translate-y-0.5">
                        <UserPlus size={18} /> Register
                        </Link>
                    </div>
                    )}

                    <button 
                        onClick={toggleTheme} 
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors relative overflow-hidden focus:outline-none"
                    >
                    {isDark ? <Moon size={20} className="text-blue-300" /> : <Sun size={20} className="text-yellow-500" />}
                    </button>

                    <Link to="/cart" className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-primary transition-colors">
                    <ShoppingCart size={24} />
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white bg-danger rounded-full shadow-sm animate-bounce">
                        {cartCount}
                        </span>
                    )}
                    </Link>
                </div>

                {/* Mobile Icons Row */}
                <div className="flex md:hidden items-center gap-0.5 sm:gap-2">
                    <button 
                        onClick={() => setIsMobileSearchOpen(true)}
                        className="p-2 text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <Search size={22} />
                    </button>

                    <button 
                        onClick={toggleTheme} 
                        className="p-2 text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        {isDark ? <Moon size={22} className="text-blue-300" /> : <Sun size={22} className="text-yellow-500" />}
                    </button>
                    
                    {isAuthenticated ? (
                        <Link to="/profile" className="p-2 text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <User size={22} />
                        </Link>
                    ) : (
                         <Link to="/login" className="p-2 text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <LogIn size={22} />
                        </Link>
                    )}

                    <Link to="/cart" className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <ShoppingCart size={22} />
                        {cartCount > 0 && (
                            <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold leading-none text-white bg-danger rounded-full shadow-sm">
                            {cartCount}
                            </span>
                        )}
                    </Link>

                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
             </>
          )}
        </div>
      </div>

      {/* Mobile Menu Content */}
      {isMenuOpen && !isMobileSearchOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-lg absolute w-full z-40">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <Link 
                to="/products" 
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-3 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800"
            >
               <Grid size={20} /> Products Catalog
            </Link>
            {isAuthenticated ? (
              <>
                <Link 
                    to="/orders" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-3 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                    <Package size={20} /> My Orders
                </Link>
                <Link 
                    to="/profile" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-3 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                    <User size={20} /> My Profile
                </Link>
                <button 
                    onClick={handleLogout} 
                    className="flex w-full items-center gap-2 px-3 py-3 rounded-md text-base font-medium text-danger hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                >
                    <LogIn size={20} className="rotate-180" /> Logout
                </button>
              </>
            ) : (
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <Link 
                        to="/login" 
                        onClick={() => setIsMenuOpen(false)}
                        className="flex justify-center items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                        Login
                    </Link>
                    <Link 
                        to="/register" 
                        onClick={() => setIsMenuOpen(false)}
                        className="flex justify-center items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold bg-primary text-white"
                    >
                        Register
                    </Link>
                </div>
            )}
          </div>
        </div>
      )}
    </nav>
    </>
  );
};
