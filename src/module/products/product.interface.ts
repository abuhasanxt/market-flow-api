export interface ProductData {
  id?: string;
  vendorId?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  imageUrl?: string;
  ratingAvg?: number;
  ratingCount?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}