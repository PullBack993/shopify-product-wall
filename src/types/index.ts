export interface Product {
  id: number
  title: string
  handle: string
  productUrl: string
  imageUrl: string
  imageAlt: string
  price: string
  vendor: string
  productType: string
  createdAt: string
  updatedAt: string
  localImageUrl: string
}

export interface GridImage {
  id: string
  url: string
  alt: string
  text: string
  qrCodeData: string
  aspectRatio: number
  price?: string
  productType?: string
} 