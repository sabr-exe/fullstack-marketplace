
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight } from 'lucide-react';
import api from '../api/client';
import { Order } from '../types';
import { formatPrice, getImageUrl } from '../utils/helpers';
import { ORDER_STATUS_COLORS } from '../utils/constants';
import { Button } from '../components/ui/Button';

const OrdersPage: React.FC = () => {
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => (await api.get('/orders/')).data,
  });

  if (isLoading) return <div className="text-center py-10">Loading orders...</div>;

  return (
    <div className="px-4 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">Order History</h1>
      <div className="space-y-6">
        {orders?.length === 0 ? (
            <div className="text-center text-gray-500 py-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">No orders found.</div>
        ) : orders?.map((order) => (
          <div key={order.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 transition-all hover:shadow-xl">
            <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
              <div>
                <div className="flex items-center gap-3">
                    <span className="font-bold text-xl dark:text-white">Order #{order.id}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${ORDER_STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
                    {order.status}
                    </span>
                </div>
                <p className="text-gray-500 text-sm mt-1">Placed on {format(new Date(order.created_at), 'PPP p')}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-2xl dark:text-white text-primary">{formatPrice(order.total_price)}</span>
              </div>
            </div>
            
            {/* Detailed Timeline */}
            <div className="mt-6 mb-6">
                <h4 className="text-sm font-semibold dark:text-gray-300 mb-3">Status Timeline</h4>
                <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-4">
                    {order.status_history.map((hist, i) => (
                        <div key={i} className="relative">
                            <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-white dark:border-gray-800"></div>
                            <p className="text-sm font-medium dark:text-white">
                                {hist.from_status === 'created' ? 'Order Created' : `Status changed to ${hist.to_status}`}
                            </p>
                            <p className="text-xs text-gray-500">
                                {format(new Date(hist.created_at), 'PP p')}
                                {hist.comment && <span className="italic ml-1">- {hist.comment}</span>}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Items Preview */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.items.slice(0, 4).map((item, idx) => (
                        <Link 
                            to={`/products/${item.product}`} 
                            key={idx} 
                            className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <img 
                                src={getImageUrl(item.main_image)} 
                                alt={item.product_name} 
                                className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium dark:text-white truncate">{item.product_name}</p>
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    <span>Qty: {item.quantity}</span>
                                    <span>{formatPrice(item.price)}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {order.items.length > 4 && (
                        <div className="flex items-center justify-center p-2 text-sm text-gray-500">
                            + {order.items.length - 4} more items...
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end">
                <Link to={`/orders/${order.id}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                        View Full Details <ArrowRight size={16} />
                    </Button>
                </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersPage;
