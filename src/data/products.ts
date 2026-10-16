export type ProductCategory =
  | "Laptops"
  | "Monitors"
  | "Phones"
  | "Audio"
  | "Accessories";

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: ProductCategory;
  description: string;
  price: number;
  previousPrice?: number;
  condition: "Brand new" | "UK used";
  image: string;
  featured?: boolean;
  badge?: string;
}

export const products: Product[] = [
  {
    id: "p001",
    slug: "macbook-air-m3",
    name: "MacBook Air 13-inch M3",
    brand: "Apple",
    category: "Laptops",
    description: "Lightweight design. Serious performance.",
    price: 1450000,
    previousPrice: 1550000,
    condition: "Brand new",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=85",
    featured: true,
    badge: "Featured",
  },
  {
    id: "p002",
    slug: "hp-elitebook-840-g8",
    name: "EliteBook 840 G8",
    brand: "HP",
    category: "Laptops",
    description: "A dependable professional workstation.",
    price: 580000,
    condition: "UK used",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85",
    badge: "Popular",
  },
  {
    id: "p003",
    slug: "dell-xps-13",
    name: "XPS 13",
    brand: "Dell",
    category: "Laptops",
    description: "Minimal design. Made for productivity.",
    price: 980000,
    condition: "UK used",
    image:
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "p004",
    slug: "macbook-pro-14",
    name: "MacBook Pro 14-inch",
    brand: "Apple",
    category: "Laptops",
    description: "Power for demanding creative workflows.",
    price: 2350000,
    condition: "Brand new",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=85",
    featured: true,
  },
  {
    id: "p005",
    slug: "samsung-27-inch-monitor",
    name: "27-inch Full HD Monitor",
    brand: "Samsung",
    category: "Monitors",
    description: "More room for your ideas and workflow.",
    price: 420000,
    condition: "Brand new",
    image:
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "p006",
    slug: "lg-ultrawide-monitor",
    name: "UltraWide Monitor",
    brand: "LG",
    category: "Monitors",
    description: "A wider view for focused work.",
    price: 760000,
    condition: "Brand new",
    image:
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=85",
    badge: "Workspace pick",
  },
  {
    id: "p007",
    slug: "iphone-15",
    name: "iPhone 15",
    brand: "Apple",
    category: "Phones",
    description: "Everyday performance in a refined design.",
    price: 950000,
    condition: "UK used",
    image:
      "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "p008",
    slug: "samsung-galaxy-s24",
    name: "Galaxy S24",
    brand: "Samsung",
    category: "Phones",
    description: "A capable companion for your everyday.",
    price: 890000,
    condition: "UK used",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "p009",
    slug: "sony-wh1000xm5",
    name: "WH-1000XM5 Headphones",
    brand: "Sony",
    category: "Audio",
    description: "Immersive sound with noise cancellation.",
    price: 480000,
    condition: "Brand new",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
    featured: true,
  },
  {
    id: "p010",
    slug: "wireless-headphones",
    name: "Studio Wireless Headphones",
    brand: "Audio",
    category: "Audio",
    description: "Comfortable listening, wherever you go.",
    price: 125000,
    condition: "Brand new",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "p011",
    slug: "mx-master-wireless-mouse",
    name: "MX Master Wireless Mouse",
    brand: "Logitech",
    category: "Accessories",
    description: "Precision control for your daily workflow.",
    price: 185000,
    condition: "Brand new",
    image:
      "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "p012",
    slug: "usb-c-multiport-hub",
    name: "USB-C Multiport Hub",
    brand: "Anker",
    category: "Accessories",
    description: "Connect more. Keep your setup simple.",
    price: 85000,
    condition: "Brand new",
    image:
      "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=900&q=85",
  },
];

export const categories = [
  "All",
  "Laptops",
  "Monitors",
  "Phones",
  "Audio",
  "Accessories",
] as const;

export type CategoryFilter = (typeof categories)[number];

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(price);
}
