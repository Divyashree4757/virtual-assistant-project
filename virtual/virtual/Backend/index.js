import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";

dotenv.config();
const app = express();

// MIDDLEWARE
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// ✅ ROUTES ONLY - NO WILDCARD
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

// ✅ NO app.use("*") - DELETE THIS LINE

const PORT = process.env.PORT || 8000;
connectDb().then(() => {
  app.listen(PORT, () => console.log(`Server: ${PORT}`));
});
