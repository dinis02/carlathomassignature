export interface Product {
  id: number;
  brand: string;
  name: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  badgeDark?: boolean;
  gradientFrom: string;
  gradientTo: string;
  rating: number;
  reviewCount: number;
  category: string;
  shades?: Shade[];
  finishes?: string[];
  description?: string;
  howToApply?: string;
  ingredients?: string;
  image?: string;
  galleryImages?: string[];
  stock?: number;
  isActive?: boolean;
}

export interface Shade {
  name: string;
  color: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedShade?: string;
  selectedFinish?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shippingMethod: string;
  paymentMethod: string;
  rewardPoints: number;
}
