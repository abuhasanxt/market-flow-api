import z from "zod";
import { SubOrderStatus } from "../../../generated/prisma/enums";

export const applyAsSellerZodSchema=z.object({
    storeName: z.string("StoreName is required and must be string")
        .min(5, "StoreName must be at least 5 characters")
        .max(50, "StoreName must be at most 50 characters"),
})


export const updateSubOrderStatusSchema = z.object({
  status: z.nativeEnum(SubOrderStatus),
});