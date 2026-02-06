import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import api from '../api/client';
import { generateUUID, formatPrice } from '../utils/helpers';
import { Order } from '../types';

// Step 1 Schema
const shippingSchema = z.object({
  phone_number: z.string().min(10, 'Valid phone number required'),
  delivery_method: z.enum(['delivery', 'pickup']),
  delivery_address: z.string().optional(),
  delivery_time: z.string().optional(),
  store_address: z.string().optional(),
  customer_email: z.string().email(),
}).refine((data) => {
    if (data.delivery_method === 'delivery') {
        return !!data.delivery_address && !!data.delivery_time;
    }
    return !!data.store_address;
}, { message: "Address details required for selected method", path: ['delivery_address'] });

type ShippingData = z.infer<typeof shippingSchema>;

const CheckoutPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ShippingData | null>(null);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ShippingData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
        delivery_method: 'delivery',
    }
  });

  const deliveryMethod = watch('delivery_method');

  const createOrderMutation = useMutation({
    mutationFn: async (data: ShippingData) => {
        const idempotencyKey = generateUUID();
        const payload = { ...data, delivery_time: data.delivery_time
            ? new Date(data.delivery_time).toISOString()
            : null, };   // 1v
        const res = await api.post('/orders/create/', payload, {
            headers: { 'Idempotency-Key': idempotencyKey }
        });
        return res.data;
    },
    onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        toast.success('Order placed successfully!');
        setSuccessOrder(data); // Set the returned order data for display
    },
    onError: (err: any) => {
        toast.error(err.response?.data?.detail || 'Failed to place order');
    }
  });

  const onNext = (data: ShippingData) => {
    setFormData(data);
    setStep(2);
  };

  const onConfirm = () => {
    if (formData) {
        createOrderMutation.mutate(formData);
    }
  };

  if (successOrder) {
      return (
          <div className="max-w-2xl mx-auto px-4 py-16 text-center">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="text-green-600 dark:text-green-400" size={40} />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Order Confirmed!</h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-8">
                      Thank you for your purchase. Your order <span className="font-mono font-bold text-gray-900 dark:text-white">#{successOrder.id}</span> has been received.
                  </p>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 mb-8 text-left">
                      <div className="flex justify-between mb-4 border-b border-gray-200 dark:border-gray-600 pb-4">
                          <span className="text-gray-600 dark:text-gray-300">Amount Paid</span>
                          <span className="font-bold text-xl text-primary">{formatPrice(successOrder.total_price)}</span>
                      </div>
                      <div className="space-y-2">
                           <p className="text-sm text-gray-500 dark:text-gray-400">
                               <span className="font-medium text-gray-700 dark:text-gray-200">Delivery Method:</span> {successOrder.delivery_method === 'delivery' ? 'Courier Delivery' : 'Store Pickup'}
                           </p>
                           {successOrder.delivery_method === 'delivery' && (
                               <p className="text-sm text-gray-500 dark:text-gray-400">
                                   <span className="font-medium text-gray-700 dark:text-gray-200">Address:</span> {successOrder.delivery_address}
                               </p>
                           )}
                           <p className="text-sm text-gray-500 dark:text-gray-400">
                               <span className="font-medium text-gray-700 dark:text-gray-200">Items:</span> {successOrder?.items?.length ?? 0} product(s)   {/* 1v */}
                           </p>
                      </div>
                  </div>

                  <Link to="/orders">
                      <Button size="lg" className="gap-2">
                          View Order History <ArrowRight size={20} />
                      </Button>
                  </Link>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Steps Indicator */}
      <div className="flex items-center justify-between mb-8 text-sm font-medium">
         <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
            <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center">1</span> Shipping
         </div>
         <div className="h-px bg-gray-300 flex-1 mx-4"></div>
         <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
            <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center">2</span> Confirm
         </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        {step === 1 ? (
            <form onSubmit={handleSubmit(onNext)} className="space-y-6">
                <h2 className="text-2xl font-bold dark:text-white">Shipping Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Email" {...register('customer_email')} error={errors.customer_email?.message} />
                    <Input label="Phone Number" {...register('phone_number')} error={errors.phone_number?.message} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Delivery Method</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer dark:text-white">
                            <input type="radio" value="delivery" {...register('delivery_method')} className="text-primary focus:ring-primary" />
                            Courier Delivery
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer dark:text-white">
                            <input type="radio" value="pickup" {...register('delivery_method')} className="text-primary focus:ring-primary" />
                            Store Pickup
                        </label>
                    </div>
                </div>

                {deliveryMethod === 'delivery' ? (
                    <>
                        <Input label="Delivery Address" {...register('delivery_address')} error={errors.delivery_address?.message} />
                        <Input label="Preferred Delivery Time" type="datetime-local" {...register('delivery_time')} error={errors.delivery_time?.message} />
                    </>
                ) : (
                    <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Store Address</label>
                         <select {...register('store_address')} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                             <option value="">Select a store...</option>
                             <option value="Main Street 123">Main Street 123</option>
                             <option value="Broadway 456">Broadway 456</option>
                         </select>
                         {errors.store_address && <p className="text-danger text-sm mt-1">{errors.store_address.message}</p>}
                    </div>
                )}

                <Button type="submit" className="w-full">Review Order</Button>
            </form>
        ) : (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold dark:text-white">Order Summary</h2>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2 text-sm dark:text-gray-200">
                    <p><span className="font-bold">Email:</span> {formData?.customer_email}</p>
                    <p><span className="font-bold">Phone:</span> {formData?.phone_number}</p>
                    <p><span className="font-bold">Method:</span> {formData?.delivery_method === 'delivery' ? 'Courier' : 'Pickup'}</p>
                    {formData?.delivery_method === 'delivery' ? (
                         <p><span className="font-bold">Address:</span> {formData?.delivery_address}</p>
                    ) : (
                         <p><span className="font-bold">Store:</span> {formData?.store_address}</p>
                    )}
                </div>

                <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setStep(1)} className="w-full">Back</Button>
                    <Button 
                        variant="primary" 
                        onClick={onConfirm} 
                        className="w-full"
                        isLoading={createOrderMutation.isPending}
                    >
                        Place Order
                    </Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;