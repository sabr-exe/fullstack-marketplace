
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, MapPin, Truck, Calendar, CreditCard, Package, ExternalLink } from 'lucide-react';
import api from '../api/client';
import { Order } from '../types';
import { formatPrice, getImageUrl } from '../utils/helpers';
import { ORDER_STATUS_COLORS } from '../utils/constants';
import { Button } from '../components/ui/Button';

const OrderDetailPage: React.FC = () => {
  const { id } = useParams();

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: async () => (await api.get(`/orders/${id}/`)).data,
  });

  if (isLoading) return <div className="text-center py-20">Loading order details...</div>;
  if (!order) return <div className="text-center py-20">Order not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Styled Back Button */}
      <Link to="/orders" className="inline-block mb-6">
          <Button variant="outline" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-all">
             <ArrowLeft size={16} /> Back to Orders
          </Button>
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between md:items-center gap-4 bg-gray-50 dark:bg-gray-900/50">
           <div>
              <h1 className="text-2xl font-bold dark:text-white">Order #{order.id}</h1>
              <p className="text-gray-500 text-sm mt-1">Placed on {format(new Date(order.created_at), 'PPP p')}</p>
           </div>
           <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide ${ORDER_STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
              {order.status}
           </span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Order Items with Images */}
            <div className="space-y-6">
                <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                    <Package size={20} className="text-primary" /> Items
                </h3>
                <div className="space-y-4">
                    {order.items.map((item, idx) => {
                        const unitPrice = parseFloat(item.price);
                        const lineTotal = unitPrice * item.quantity;
                        
                        return (
                            <div key={idx} className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg gap-4 group transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50">
                                <Link to={`/products/${item.product}`} className="shrink-0">
                                    <img 
                                        src={getImageUrl(item.main_image)} 
                                        alt={item.product_name} 
                                        className="w-16 h-16 object-cover rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600"
                                    />
                                </Link>
                                <div className="flex-1 min-w-0">
                                    <Link to={`/products/${item.product}`} className="font-medium dark:text-white text-sm sm:text-base hover:text-primary transition-colors flex items-center gap-1">
                                        {item.product_name}
                                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-50" />
                                    </Link>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Qty: {item.quantity} × {formatPrice(unitPrice)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold dark:text-white whitespace-nowrap">{formatPrice(lineTotal)}</p>
                                    <p className="text-xs text-gray-400">Total</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <span className="font-bold text-lg dark:text-white">Total Amount</span>
                    <span className="font-bold text-2xl text-primary">{formatPrice(order.total_price)}</span>
                </div>
            </div>

            {/* Delivery & Info */}
            <div className="space-y-6">
                 <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                    <Truck size={20} className="text-primary" /> Delivery Information
                </h3>
                
                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg space-y-3">
                    <div className="flex items-start gap-3">
                        <MapPin size={18} className="text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium dark:text-gray-300">Method</p>
                            <p className="dark:text-white font-semibold capitalize">{order.delivery_method}</p>
                        </div>
                    </div>

                    {order.delivery_method === 'delivery' ? (
                        <>
                            <div className="flex items-start gap-3">
                                <div className="w-4.5"></div>
                                <div>
                                    <p className="text-sm font-medium dark:text-gray-300">Address</p>
                                    <p className="dark:text-white">{order.delivery_address}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar size={18} className="text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium dark:text-gray-300">Preferred Time</p>
                                    <p className="dark:text-white">{order.delivery_time ? format(new Date(order.delivery_time), 'PP p') : 'N/A'}</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-start gap-3">
                            <div className="w-4.5"></div>
                             <div>
                                <p className="text-sm font-medium dark:text-gray-300">Store Address</p>
                                <p className="dark:text-white">{order.store_address}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-start gap-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <CreditCard size={18} className="text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium dark:text-gray-300">Contact</p>
                            <p className="dark:text-white">{order.phone_number}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Status History */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-lg dark:text-white mb-4">Detailed Status History</h3>
            <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-6">
                {order.status_history.map((hist, i) => (
                    <div key={i} className="relative">
                        <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white dark:bg-gray-800 border-4 border-primary"></div>
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                            <span className="font-bold dark:text-white text-lg capitalize">{hist.to_status}</span>
                            <span className="text-sm text-gray-500">{format(new Date(hist.created_at), 'PPP p')}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Changed from <span className="font-medium">{hist.from_status}</span>
                            {hist.changed_by && <span> by {hist.changed_by}</span>}
                        </p>
                         {hist.comment && <p className="text-sm text-gray-500 italic mt-1 bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 inline-block">Note: {hist.comment}</p>}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
