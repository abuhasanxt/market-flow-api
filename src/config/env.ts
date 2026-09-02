import dotenv from "dotenv";
import AppError from "../errorHelpers/AppError";
import status from "http-status";
dotenv.config();

interface EnvConfig {
  PORT: string;
  NODE_ENV: string;
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  FRONTEND_URL:string;
   EMAIL_SENDER: {
    SMTP_USER: string;
    SMTP_PASSWORD: string;
    SMTP_HOST: string;
    SMTP_PORT: string;
    SMTP_FROM: string;
  };
  PLATFORM_COMMISSION_RATE: number;
  STRIPE: {
    SECRET_KEY: string;
    WEBHOOK_SECRET: string;
  }
  REDIS_URL: string;
}

const loadEnvVariables = (): EnvConfig => {
  const requiredEnvVariable = [
    "PORT",
    "NODE_ENV",
    "DATABASE_URL",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "JWT_REFRESH_EXPIRES_IN",
    "FRONTEND_URL",
     "EMAIL_SENDER_SMTP_USER",
    "EMAIL_SENDER_SMTP_PASSWORD",
    "EMAIL_SENDER_SMTP_HOST",
    "EMAIL_SENDER_SMTP_PORT",
    "EMAIL_SENDER_SMTP_FROM",
    "PLATFORM_COMMISSION_RATE",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET"
  ];
  requiredEnvVariable.forEach((variable) => {
    if (!process.env[variable]) {
      throw new AppError(
        status.INTERNAL_SERVER_ERROR,
        `Environment variable ${variable} is required but not set in .env file`,
      );
    }
  });
  return {
    PORT: process.env.PORT as string,
    NODE_ENV: process.env.NODE_ENV as string,
    DATABASE_URL: process.env.DATABASE_URL as string,
    REDIS_URL: process.env.REDIS_URL as string,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN as string,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN as string,
    FRONTEND_URL:process.env.FRONTEND_URL as string,
    EMAIL_SENDER: {
      SMTP_USER: process.env.EMAIL_SENDER_SMTP_USER as string,
      SMTP_PASSWORD: process.env.EMAIL_SENDER_SMTP_PASSWORD as string,
      SMTP_HOST: process.env.EMAIL_SENDER_SMTP_HOST as string,
      SMTP_PORT: process.env.EMAIL_SENDER_SMTP_PORT as string,
      SMTP_FROM: process.env.EMAIL_SENDER_SMTP_FROM as string,
    },
    PLATFORM_COMMISSION_RATE: Number(process.env.PLATFORM_COMMISSION_RATE),
    STRIPE:{
      SECRET_KEY: process.env.STRIPE_SECRET_KEY as string,
      WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET as string,  
    }
  }
};
export const envVars: EnvConfig = loadEnvVariables();
