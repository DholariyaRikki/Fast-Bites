import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/connectdb";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoute from "./routes/user.route";
import restaurantRoute from "./routes/restaurant.route";
import menuRoute from "./routes/menu.route";
import orderRoute from "./routes/order.route";
import messageRoute from "./routes/message.route";
import offerRoute from "./routes/offer.route";
import reviewRoute from "./routes/review.route";
import path from "path";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

// default middleware for any mern project
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json());
app.use(cookieParser());

// CORS configuration
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
}
app.use(cors(corsOptions));

// api
app.use("/api/user", userRoute);
app.use("/api/restaurant", restaurantRoute);
app.use("/api/menu", menuRoute);
app.use("/api/order", orderRoute);
app.use("/api/message", messageRoute);
app.use("/api/offer", offerRoute);
app.use("/api/review", reviewRoute);

const DIRNAME = __dirname;  // Ensure this is set correctly
app.use(express.static(path.join(DIRNAME, '../frontend')));

// Catch-all route to serve index.html (for client-side routing in SPAs)
app.use("*", (_, res) => {
  res.sendFile(path.join(DIRNAME, "../frontend", "index.html"));
});

app.listen(PORT, () => {
  connectDB();
  console.log(`Server listen at port ${PORT}`);
});