export interface ProductData {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  imageUrl: string;
  isActive?: boolean;
}
