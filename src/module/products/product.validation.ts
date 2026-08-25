import z from "zod";

export const createProductZodSchema = z.object({
  name: z
    .string("Name is required and must be string")
    .min(5, "Name must be at least 5 characters")
    .max(30, "Name must be at most 30 characters"),

  description: z
    .string("Description is required and must be string")
    .min(5, "Description must be at least 5 characters")
    .max(100, "Description must be at most 100 characters"),

  price: z
    .number("Price is required")
    .int("Price must be an integer")
    .positive("Price must be greater than 0"),

  stock: z
    .number("Stock is required")
    .int("Stock must be an integer")
    .min(0, "Stock cannot be negative"),

  categoryId: z
    .string("Category ID is required")
    .uuid("Category ID must be a valid UUID"),

  isActive: z.boolean().default(true),
});
