
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  age?: number;
  birth_date?: string;
  gender?: 'male' | 'female';
  is_staff: boolean;
  is_email_verified: boolean;
}

export interface AuthResponse {
  access: string;
  refresh: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number | null;
  children: Category[];
}

export interface ProductImage {
  id: number;
  image: string;
  is_main: boolean;
}

export interface ProductAttributeValue {
  attribute: string;
  slug: string;
  value: string | number | boolean | null;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string; // Decimal comes as string
  old_price?: string;
  stock: number;
  images: ProductImage[];
  main_image?: string; // from list serializer
  rating: string;
  reviews_count: number;
  attributes: ProductAttributeValue[];
  created_at?: string; // Added for "New" badge logic
}

export interface CartItem {
  id: number;
  product: number;
  product_name: string;
  product_price: string;
  quantity: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
}

export interface OrderItem {
  product: number;
  product_name: string;
  price: string;
  quantity: number;
  main_image?: string; // Added for order history display
}

export interface OrderStatusHistory {
  from_status: string;
  to_status: string;
  changed_by: string;
  comment: string;
  created_at: string;
}

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  DELIVERED = "delivered", 
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}
export interface Order {
  id: number;
  status: OrderStatus;
  delivery_method: 'delivery' | 'pickup';
  phone_number: string;
  delivery_address?: string;
  delivery_time?: string;
  store_address?: string;
  total_price: string;
  created_at: string;
  items: OrderItem[];
  status_history: OrderStatusHistory[];
}

export interface Review {
  id: number;
  rating: number;
  text: string;
  user_email: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  [key: string]: any;
}
