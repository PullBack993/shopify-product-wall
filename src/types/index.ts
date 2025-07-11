export interface Product {
  id: number;
  title: string;
  handle: string;
  productUrl: string;
  imageUrl: string;
  imageAlt: string;
  price: string;
  compareAtPrice?: string; // For sale pricing
  vendor: string;
  productType: string;
  tags: string; // Raw tags string for manual processing
  createdAt: string;
  updatedAt: string;
  localImageUrl: string;
  allImages: any[]; // All product images
  description?: string; // Product description
  status: string;
  variants: any[]; // All product variants
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
} 