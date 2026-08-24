/* eslint-disable @typescript-eslint/no-unused-vars */
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


export const adminService={
    getAllSellerApply
}