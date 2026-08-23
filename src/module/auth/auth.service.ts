/* eslint-disable @typescript-eslint/no-unused-vars */

import { prisma } from "../../lib/prisma";
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
  const { passwordHash: _, ...safeUser } = result;

  return safeUser;
};

const loginUser = async (payload: UserLogin) => {
  const { email, password } = payload;
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (!existingUser) {
    throw new Error("User Not FOund");
  }

  const isPasswordMatched = await bcrypt.compare(
    password,
    existingUser.passwordHash,
  );

  if (!isPasswordMatched) {
    throw new Error("Invalid email or password");
  }

  const { passwordHash: _, ...safeUser } = existingUser;

  return safeUser;
};

export const authService = {
  registerBuyer,
  loginUser,
};
