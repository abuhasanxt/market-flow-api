/* eslint-disable @typescript-eslint/no-unused-vars */
import { VendorStatus } from "../../../generated/prisma/enums"
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
        }
    })

    return result
}

export const adminService={
    getAllSellerApply,
    getSellerPending
}