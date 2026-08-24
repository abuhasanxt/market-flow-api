
/* eslint-disable @typescript-eslint/no-unused-vars */
import status from "http-status"
import { VendorStatus } from "../../../generated/prisma/enums"
import AppError from "../../errorHelpers/AppError"
import { prisma } from "../../lib/prisma"

const getAllSellerApply=async()=>{
    const apply=await prisma.vendor.findMany({
        include:{
            user:true
        },
        orderBy:{
            createdAt:"desc"
        }
    })

    return apply.map(({ user, ...vendor }) => {
        const { passwordHash: _, ...safeUser } = user
        return {
            ...vendor,
            user: safeUser
        }
    })
}

const getSellerPending=async()=>{
    const result=await prisma.vendor.findMany({
        where:{
            status:VendorStatus.PENDING
        },
        include:{
            user:true
        },
        orderBy:{
            createdAt:"desc"
        }
    })

     return result.map(({ user, ...vendor }) => {
        const { passwordHash: _, ...safeUser } = user
        return {
            ...vendor,
            user: safeUser
        }
    })
}
const getSellerSuspend=async()=>{
    const result=await prisma.vendor.findMany({
        where:{
            status:VendorStatus.SUSPENDED
        },
        include:{
            user:true
        },
        orderBy:{
            createdAt:"desc"
        }
    })

     return result.map(({ user, ...vendor }) => {
        const { passwordHash: _, ...safeUser } = user
        return {
            ...vendor,
            user: safeUser
        }
    })
}

const getSellerApproved=async()=>{
    const result=await prisma.vendor.findMany({
        where:{
            status:VendorStatus.APPROVED
        },
        include:{
            user:true
        },
        orderBy:{
            createdAt:"desc"
        }
    })

     return result.map(({ user, ...vendor }) => {
        const { passwordHash: _, ...safeUser } = user
        return {
            ...vendor,
            user: safeUser
        }
    })
}

const approveSeller = async (vendorId: string) => {
  const vendor = await prisma.vendor.findUnique({
    where: {
      id: vendorId,
    },
  });

  if (!vendor) {
    throw new AppError(
      status.NOT_FOUND,
      "Seller application not found.",
    );
  }

  if (vendor.status ===VendorStatus.APPROVED) {
    throw new AppError(
      status.BAD_REQUEST,
      "Seller application is already approved.",
    );
  }

  // Check user exists
  const user = await prisma.user.findUnique({
    where: {
      id: vendor.userId,
    },
  });

  if (!user) {
    throw new AppError(
      status.NOT_FOUND,
      "User not found.",
    );
  }

  // Transaction
  const [updatedVendor, updatedUser] =
    await prisma.$transaction([
      prisma.vendor.update({
        where: {
          id: vendorId,
        },
        data: {
          status: "APPROVED",
        },
      }),

      prisma.user.update({
        where: {
          id: vendor.userId,
        },
        data: {
          role: "SELLER",
        },
      }),
    ]);

  return {
    vendor: updatedVendor,
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    },
  };
};


const suspendSeller = async (vendorId: string) => {
  const vendor = await prisma.vendor.findUnique({
    where: {
      id: vendorId,
    },
  });

  if (!vendor) {
    throw new AppError(
      status.NOT_FOUND,
      "Seller application not found.",
    );
  }

  if (vendor.status === VendorStatus.SUSPENDED) {
    throw new AppError(
      status.BAD_REQUEST,
      "Seller is already suspended.",
    );
  }

  const updatedVendor = await prisma.vendor.update({
    where: {
      id: vendorId,
    },
    data: {
      status: "SUSPENDED",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return updatedVendor;
};

export const adminService={
    getAllSellerApply,
    getSellerPending,
    getSellerSuspend,
    getSellerApproved,
    approveSeller,
    suspendSeller
}