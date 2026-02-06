import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag } from 'lucide-react';
import api from '../api/client';
import { Cart } from '../types';
import { Button } from '../components/ui/Button';
import { formatPrice } from '../utils/helpers';
import toast from 'react-hot-toast';

const CartPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery<Cart>({
    queryKey: ['cart'],
    queryFn: async () => (await api.get('/cart/')).data,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, qty }: { id: number; qty: number }) => {
        await api.post('/cart/update/', { item_id: id, quantity: qty });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: number) => {
        await api.post('/cart/remove/', { item_id: id });
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        toast.success('Item removed');
    },
  });

  if (isLoading) return <div className="text-center py-20">Loading cart...</div>;

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.product_price) * item.quantity), 0);

  if (items.length === 0) {
    return (
        <div className="text-center py-20">
            <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
            <Link to="/products">
                <Button variant="primary">Start Shopping</Button>
            </Link>
        </div>
    );
  }

  return (
    <div className="px-4">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">Shopping Cart</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Items List */}
        <div className="flex-1 space-y-4">
            {items.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                    <div className="flex-1 text-center sm:text-left">
                        <Link to={`/products/${item.product}`} className="font-semibold text-lg dark:text-white hover:text-primary">
                            {item.product_name}
                        </Link>
                        <div className="text-gray-500 dark:text-gray-400">{formatPrice(item.product_price)}</div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
                            <button 
                                className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50" 
                                onClick={() => updateMutation.mutate({ id: item.id, qty: item.quantity - 1 })}
                                disabled={updateMutation.isPending}
                            >-</button>
                            <span className="w-8 text-center dark:text-white">{item.quantity}</span>
                            <button 
                                className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                                onClick={() => updateMutation.mutate({ id: item.id, qty: item.quantity + 1 })}
                                disabled={updateMutation.isPending}
                            >+</button>
                        </div>
                        <button 
                            onClick={() => removeMutation.mutate(item.id)}
                            className="text-danger hover:bg-red-50 p-2 rounded-full"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>
            ))}
        </div>

        {/* Summary */}
        <div className="w-full lg:w-80 h-fit bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm space-y-4">
            <h3 className="font-bold text-lg dark:text-white border-b pb-2 dark:border-gray-700">Order Summary</h3>
            <div className="flex justify-between dark:text-gray-300">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between font-bold text-xl dark:text-white pt-2">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
            </div>
            <Link to="/checkout" className="block">
                <Button className="w-full mt-4">Proceed to Checkout</Button>
            </Link>
        </div>
      </div>
    </div>
  );
};

export default CartPage;