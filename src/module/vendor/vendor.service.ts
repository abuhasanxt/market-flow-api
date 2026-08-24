import status from "http-status"
import AppError from "../../errorHelpers/AppError"
import { prisma } from "../../lib/prisma"
import { Role } from "../../../generated/prisma/enums"

const applyAsSeller=async (userId:string,payload:{storeName:string})=>{
const user=await prisma.user.findUnique({
    where:{
        id:userId
    }
})

if (!user) {
    throw new AppError(status.NOT_FOUND,"User not found")
}

if (user.role===Role.ADMIN) {
    throw new AppError(
      status.BAD_REQUEST,
      "Admin cannot apply as seller.",
    );
}

 if (user.role === Role.SELLER) {
    throw new AppError(
      status.BAD_REQUEST,
      "You are already a seller.",
    );
  }

   const existingVendor = await prisma.vendor.findUnique({
    where: {
      userId,
    },
  });

  if (existingVendor) {
    throw new AppError(
      status.CONFLICT,
      "Seller application already exists.",
    );
  }

  const vendor = await prisma.vendor.create({
    data: {
      userId,
      storeName: payload.storeName,
    },
  });

  return vendor;
}



export const vendorServices={
    applyAsSeller
}