import express, { Application, Request, Response } from "express"
import { IndexRoute } from "./routes";
import cookieParser from "cookie-parser";
const app: Application = express();


// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());
app.use("/",IndexRoute)

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.send('Hello, Marker_Flow Backend API');
});


export default app