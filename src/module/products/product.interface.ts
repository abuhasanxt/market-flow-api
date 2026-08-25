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



export interface ProductQuery {
  categoryId?: string;
  vendorId?:string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
  q?: string;
  sort?: "price" | "createdAt";
  order?: "asc" | "desc";
  page?: string;
  limit?: string;
}


export interface ProductUpdate{
    name?: string;
  description?: string;
  price?: number;
  stock?: number;
  imageUrl?: string;
  isActive?: boolean;
    
}