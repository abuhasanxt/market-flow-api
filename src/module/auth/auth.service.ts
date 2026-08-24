/* eslint-disable @typescript-eslint/no-unused-vars */

import { prisma } from "../../lib/prisma";
import { tokenUtils } from "../../utils/token";
import { UserData, UserLogin } from "./auth.interface";
import bcrypt from "bcrypt";

const registerBuyer = async (payload: UserData) => {
  const { name, email, password } = payload;

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existingUser) {
    throw new Error(
      "An account with this email already exists. please log in .",
    );
  }
  const passwordHash = await bcrypt.hash(password, 12);

  const result = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
    },
  });
  if (!result.email) {
    throw new Error("Failed to register buyer");
  }

  const accessToken = tokenUtils.getAccessToken({
    userId: result.id,
    role: result.role,
    name: result.name,
    email: result.email,
    emailVerified: result.emailVerified,
  });

  const refreshToken = tokenUtils.getRefreshToken({
    userId: result.id,
    role: result.role,
    name: result.name,
    email: result.email,
    emailVerified: result.emailVerified,
  });
  const { passwordHash: _, ...safeUser } = result;

  return {
    ...safeUser,
    accessToken,
    refreshToken,
  };
};

const loginUser = async (payload: UserLogin) => {
  const { email, password } = payload;
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (!user) {
    throw new Error("User Not FOund");
  }

  const isPasswordMatched = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordMatched) {
    throw new Error("Invalid email or password");
  }

  const accessToken = tokenUtils.getAccessToken({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
  });
  const refreshToken = tokenUtils.getRefreshToken({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
  });

  const { passwordHash: _, ...safeUser } = user;

  const final = {
    ...safeUser,
    accessToken,
    refreshToken,
  };

  return final;
};

const getMe=async(userId:string)=>{
  const result=await prisma.user.findUnique({
    where:{
      id:userId
    }
  })
  if (!result) {
    throw new Error("User not found");
  }
  const { passwordHash: _, ...safeUser } = result;
  return safeUser
}

export const authService = {
  registerBuyer,
  loginUser,
  getMe
};
