/* eslint-disable @typescript-eslint/no-explicit-any */
import express, { Application, Request, Response } from "express"
import { IndexRoute } from "./routes";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/globalErrorHandler";
import { notFound } from "./middleware/notFound";
import { paymentController } from "./module/payment/payment.controller";
import cron from "node-cron"
import { orderService } from "./module/orders/order.service";
const app: Application = express();



app.post("/webhook", express.raw({type:"application/json"}), 
paymentController.handlerStripeWebhookEvent
  
)


// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());
cron.schedule("*/25 * * * *",async()=>{
  try {
    console.log("Running cron to cancel unpaid orders....");
    await orderService.cancelUnpaidOrders()
  } catch (error:any) {
    console.error("Error occurred while canceling unpaid orders: ",error.message)
  }


})
app.use("/",IndexRoute)

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.send('Hello, Marker_Flow Backend API');
});

app.use(errorHandler)
app.use(notFound)
export default app