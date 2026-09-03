/* eslint-disable @typescript-eslint/no-unused-vars */

import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { tokenUtils } from "../../utils/token";
import {
  UpdateUser,
  UserData,
  UserLogin,
  VerifyEmailData,
} from "./auth.interface";
import bcrypt from "bcrypt";
import { sendEmail } from "../../utils/email";
import { jwtUtils } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";
import { deleteFileFromCloudinary } from "../../config/cloudinary";

const registerBuyer = async (payload: UserData) => {
  const { name, email, password } = payload;

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existingUser) {
    throw new AppError(
      status.CONFLICT,
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
    throw new AppError(status.BAD_REQUEST, "Failed to register buyer");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  //  OTP expiry - 2 minutes
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

  //save otp
  await prisma.emailVerification.create({
    data: {
      email: normalizedEmail,
      otp,
      expiresAt,
    },
  });
  //send otp
  await sendEmail({
    to: normalizedEmail,
    subject: "Verify your email",
    templateName: "OTP",
    templateData: {
      user: result.name,
      otp,
    },
  });
  const { passwordHash: _, ...safeUser } = result;

  return safeUser;
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
    throw new AppError(status.NOT_FOUND, "User Not FOund");
  }

  const isPasswordMatched = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordMatched) {
    throw new AppError(status.BAD_REQUEST, "Invalid email or password");
  }

  //check email verification
  if (!user.emailVerified) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    //otp expiry
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    //save otp
    await prisma.emailVerification.create({
      data: {
        email: normalizedEmail,
        otp,
        expiresAt,
      },
    });

    //send otp
    await sendEmail({
      to: normalizedEmail,
      subject: "Verify Your Email",
      templateName: "OTP",
      templateData: {
        user: user.name,
        otp,
      },
    });

    throw new AppError(
      status.FORBIDDEN,
      "Please verify your email. A verification OTP has been sent to your email.",
    );
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
  return {
    ...safeUser,
    accessToken,
    refreshToken,
  };
};

const getMe = async (userId: string) => {
  const result = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!result) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }
  const { passwordHash: _, ...safeUser } = result;
  return safeUser;
};

const verifyEmail = async (payload: VerifyEmailData) => {
  const { email, otp } = payload;
  const normalizedEmail = email.toLowerCase().trim();
  //find otp
  const verification = await prisma.emailVerification.findFirst({
    where: {
      email: normalizedEmail,
      otp,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!verification) {
    throw new AppError(status.NOT_FOUND, "Verification OTP not found");
  }

  //check otp
  if (verification.otp !== otp) {
    throw new AppError(status.BAD_REQUEST, "Invalid verification OTP .");
  }

  //check expire
  if (verification.expiresAt < new Date()) {
    throw new AppError(status.BAD_REQUEST, "Verification OTP has expired.");
  }

  //find user
  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  //check user
  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found.");
  }

  //already verified
  if (user.emailVerified) {
    throw new AppError(status.BAD_REQUEST, "Email is already verified.");
  }

  //  Update user + delete OTP
  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerified: true,
      },
    }),

    prisma.emailVerification.delete({
      where: {
        id: verification.id,
      },
    }),
  ]);

  return {
    message: "Email verified successfully.",
  };
};

const getNewToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new AppError(status.UNAUTHORIZED, "Refresh token is required");
  }

  //verify refresh token
  const verifiedToken = jwtUtils.verifyToken(
    refreshToken,
    envVars.JWT_REFRESH_SECRET,
  );

  //check verify refresh token
  if (!verifiedToken.success) {
    throw new AppError(status.UNAUTHORIZED, "Invalid or expired refresh token");
  }

  const data = verifiedToken.data as JwtPayload;

  if (!data) {
    throw new AppError(status.UNAUTHORIZED, "Invalid refresh token payload.");
  }

  const newAccessToken = tokenUtils.getAccessToken({
    userId: data.userId,
    role: data.role,
    name: data.name,
    email: data.email,
    emailVerified: data.emailVerified,
  });

  const newRefreshToken = tokenUtils.getRefreshToken({
    userId: data.userId,
    role: data.role,
    name: data.name,
    email: data.email,
    emailVerified: data.emailVerified,
  });

  return {
    newAccessToken,
    newRefreshToken,
  };
};

const logoutUser = async () => {
  return {
    message: "Logged out successfully",
  };
};

const updateMe = async (userId: string, payload: UpdateUser) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const updateData: {
    name?: string;
    image?: string;
  } = {};

  if (payload.name !== undefined) {
    updateData.name = payload.name;
  }
  if (payload.image) {
    updateData.image=payload.image
  }
  if (Object.keys(payload).length === 0) {
    throw new AppError(
      status.BAD_REQUEST,
      "Please provide at least one field to update",
    );
  }

  const isSame =
    (updateData.name === undefined || updateData.name === user.name) &&
    (updateData.image === undefined || updateData.image === user.image);

  if (isSame) {
    throw new AppError(
      status.CONFLICT,
      "Your provided data is already up to date",
    );
  }

  // Check whether new image is uploaded
  const isNewImageUploaded =
    updateData.image !== undefined &&
    updateData.image !== user.image;

  const result = await prisma.user.update({
    where: {
      id: userId,
    },
    data: updateData,
  });

    // Delete old image from Cloudinary
  if (isNewImageUploaded && user.image) {
    try {
      await deleteFileFromCloudinary(user.image);
    } catch (error) {
      console.error("Old image deletion failed:", error);
    }
  }
const { passwordHash: _, ...safeUser } = result;
  return safeUser;
};


const deleteMe=async(userId:string)=>{
  const user=await prisma.user.findUnique({
    where:{
      id:userId
    }
  })

  if (!user) {
    throw new AppError(status.NOT_FOUND,"User not found")
  }

  const result=await prisma.user.delete({
    where:{
      id:userId
    }
  })
  return result
}
export const authService = {
  registerBuyer,
  loginUser,
  getMe,
  verifyEmail,
  getNewToken,
  logoutUser,
  updateMe,
  deleteMe
};
