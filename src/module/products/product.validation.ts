import z from "zod";


export const createProductZodSchema = z.object({
  name: z
    .string("Name is required and must be a string")
    .min(5, "Name must be at least 5 characters")
    .max(30, "Name must be at most 30 characters"),

  description: z
    .string("Description is required and must be a string")
    .min(5, "Description must be at least 5 characters")
    .max(100, "Description must be at most 100 characters"),

  price: z
    .number("Price is required and must be a number")
    .int("Price must be an integer")
    .positive("Price must be greater than 0"),

  stock: z
    .number("Stock is required and must be a number")
    .int("Stock must be an integer")
    .min(0, "Stock cannot be negative"),

  categoryId: z
    .string("Category ID is required")
    .uuid("Category ID must be a valid UUID"),

  imageUrl: z
    .string("Image URL must be a string")
    .url("Image URL must be a valid URL")
    .optional(),

  isActive: z.boolean().default(true),
});
