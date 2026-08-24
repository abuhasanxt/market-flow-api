import status from "http-status";
import { Category, Role } from "../../../generated/prisma/client";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";

const createCategories = async (
  authorId: string,
  data: Omit<Category, "id" | "authorId" | "createdAt" | "updatedAt">
) => {
  const author = await prisma.user.findUnique({
    where: {
      id: authorId,
    },
  });

  if (!author) {
    throw new AppError(
      status.NOT_FOUND,
      "User not found",
    );
  }

  if (author.role !== Role.ADMIN) {
    throw new AppError(
      status.FORBIDDEN,
      "Only admin can create category.",
    );
  }

  const result = await prisma.category.create({
    data: {
      ...data,
      authorId,
    },
  });

  return result;
};

const getAllCategory=async()=>{
    const result=await prisma.category.findMany({
        include:{
            author:{
                select:{
                    id:true,
                    name:true,
                    email:true,
                    image:true,
                    role:true,
                    
                }
            }
        }
    })
    return result
}

 type updateCategoryData ={
    name:string
}
const updateCategory=async(id:string,data:updateCategoryData)=>{
    const existingCategory=await prisma.category.findFirst({where:{id}})
    if (!existingCategory) {
        throw new AppError(status.NOT_FOUND,"Category not found")
    }
    const result=await prisma.category.update({
        where:{
            id
        },data
    })
    return result
}

const deleteCategory=async(id:string)=>{
const existingCategory=await prisma.category.findFirst({
    where:{id}
})

if (!existingCategory) {
    throw new AppError(status.NOT_FOUND,"Category not found")
}
    const result=await prisma.category.delete({
        where:{
            id
        }
    })
    return result
}
export const categoriesService = {
  createCategories,
  getAllCategory,
  updateCategory,
  deleteCategory
};
