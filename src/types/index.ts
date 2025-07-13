export interface Product {
  // Basic product info (matching Shopify API structure)
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  template_suffix: string | null;
  status: string;
  published_scope: string;
  tags: string;
  admin_graphql_api_id: string;

  // Variants (ALL variants with ALL fields)
  variants: any[];

  // Options
  options: any[];

  // Images (ALL images with original Shopify URLs)
  images: any[];
  image: any;

  // Computed fields for convenience
  productUrl: string;
  imageUrl: string;
  imageAlt: string;
  price: string;
  compareAtPrice?: string;

  // Additional metadata
  totalInventory: number;
  variantCount: number;
  imageCount: number;
  hasMultipleVariants: boolean;
  isOnSale: boolean;

  // Keep original Shopify data for reference
  _shopifyData: any;

  // Legacy fields for compatibility (deprecated)
  productType?: string; // Use product_type instead
  createdAt?: string; // Use created_at instead
  updatedAt?: string; // Use updated_at instead
  localImageUrl?: string; // No longer used
  allImages?: any[]; // Use images instead
  description?: string; // Use body_html instead
}

export interface GridImage {
  id: string;
  url: string;
  alt: string;
  text: string;
  qrCodeData: string;
  aspectRatio: number;
  price?: string;
  compareAtPrice?: string;
  productType?: string;
  label?: "sale" | "new" | "top-selling";
  // Column-based rotation properties
  columnIndex?: number;
  rowIndex?: number;
  isEvenColumn?: boolean;
  // Row-based sliding animation properties
  isEvenRow?: boolean;
  slideDirection?: "left-to-right" | "right-to-left";
  animationKey?: string;
  isSliding?: boolean;
} 