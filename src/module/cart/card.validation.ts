import z from "zod";



export const createCartZodSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z
          .string("Product ID is required")
          .uuid("Product ID must be a valid UUID"),

        quantity: z
          .number("Quantity is required")
          .int("Quantity must be an integer")
          .positive("Quantity must be greater than 0"),
      })
    )
    .min(1, "At least one product is required"),
});

export const updateCartZodSchema = z.object({
        quantity: z
          .number("Quantity is required And number")
          .int("Quantity must be an integer")
          .positive("Quantity must be greater than 0"),
      })