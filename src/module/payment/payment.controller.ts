/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { envVars } from "../../config/env";
import status from "http-status";
import { stripe } from "../../config/stripe.config";
import { paymentService } from "./payment.service";
import { sendResponse } from "../../shared/sendResponse";

const handlerStripeWebhookEvent = catchAsync(
  async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;

    const webhookSecret = envVars.STRIPE.WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.log("Missing stripe signature or webhook secret");

      return res
        .status(status.BAD_REQUEST)
        .json({ message: "Missing Stripe or Webhook Secret" });
    }
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret,
      );
    } catch (error: any) {
      console.log("Error processing Stripe Webhook :", error);

      return res
        .status(status.BAD_REQUEST)
        .json({ message: "Error processing Stripe" });
    }

    try {
      const result = await paymentService.handlerStripeWebhookEvent(event);
      sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: "Stripe webhook event processed successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error handling Stripe webhook event :", error);
      sendResponse(res, {
        success: false,
        httpStatusCode: status.INTERNAL_SERVER_ERROR,
        message: "Error handling Stripe webhook event",
      });
    }
  },
);

export const paymentController = {
  handlerStripeWebhookEvent,
};