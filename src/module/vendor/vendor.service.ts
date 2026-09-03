import status from "http-status"
import AppError from "../../errorHelpers/AppError"
import { prisma } from "../../lib/prisma"
import { Role, SubOrderStatus } from "../../../generated/prisma/enums"

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

const getMyBalance=async(userId:string)=>{
  const vendor=await prisma.vendor.findUnique({
    where:{
      userId
    },
    select:{
      id:true,
      storeName:true,
      balance:true
    }
  })
if (!vendor) {
    throw new AppError(status.NOT_FOUND, "Vendor not found");
  }
 
return vendor
}
const getMyPayouts = async (userId: string) => {
  const vendor = await prisma.vendor.findUnique({
    where: {
      userId,
    },
  });

  if (!vendor) {
    throw new AppError(status.NOT_FOUND, "Vendor not found");
  }

  const payouts = await prisma.payout.findMany({
    where: {
      vendorId: vendor.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      subOrder: {
        select: {
          id: true,
          orderId: true,
          subtotal: true,
          vendorEarning: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  return payouts;
};


const allowedTransitions: Record<
  SubOrderStatus,
  SubOrderStatus[]
> = {
  [SubOrderStatus.PENDING]: [],

  [SubOrderStatus.CONFIRMED]: [
    SubOrderStatus.PROCESSING,
  ],

  [SubOrderStatus.PROCESSING]: [
    SubOrderStatus.SHIPPED,
  ],

  [SubOrderStatus.SHIPPED]: [
    SubOrderStatus.DELIVERED,
  ],

  [SubOrderStatus.DELIVERED]: [],

  [SubOrderStatus.CANCELLED]: [],
};

const updateSubOrderStatus = async (
  userId: string,
  subOrderId: string,
  subOrderStatus: SubOrderStatus,
) => {
  //  Find vendor
  const vendor = await prisma.vendor.findUnique({
    where: {
      userId,
    },
  });

  if (!vendor) {
    throw new AppError(
      status.NOT_FOUND,
      "Vendor not found",
    );
  }

  //  Find sub-order
  const subOrder = await prisma.subOrder.findUnique({
    where: {
      id: subOrderId,
    },
  });

  if (!subOrder) {
    throw new AppError(
      status.NOT_FOUND,
      "SubOrder not found",
    );
  }

  //  Ownership check
  if (subOrder.vendorId !== vendor.id) {
    throw new AppError(
      status.FORBIDDEN,
      "You are not allowed to update this sub-order",
    );
  }

  //  Status transition validation
  const allowedStatuses =
    allowedTransitions[subOrder.status];

  if (!allowedStatuses.includes(subOrderStatus)) {
    throw new AppError(
      status.BAD_REQUEST,
      `Cannot change status from ${subOrder.status} to ${subOrderStatus}`,
    );
  }

  //  Update status
  const result = await prisma.subOrder.update({
    where: {
      id: subOrderId,
    },
    data: {
      status: subOrderStatus,
    },
  });

  return result;
};
export const vendorServices={
    applyAsSeller,
    getMyBalance,
    getMyPayouts,
    updateSubOrderStatus
}