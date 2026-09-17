import express from "express";
import cors from "cors";
import pool from "./db.js";
import authRouter from "./routes/auth.js";
import { authenticate } from "./middleware/auth.js";
import { requireRoomMember } from "./middleware/room.js";
import { requireRoomOwner } from "./middleware/roomOwner.js";
import roomRouter from "./routes/rooms.js";
import cookieParser from "cookie-parser";
const app = express();
const PORT = 5000;
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}

app.use(cors({
  origin:"http://localhost:5173",
  credentials:true,
}));
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/rooms",roomRouter);
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Study Room API is running",
  });
});



app.get("/api/profile",authenticate,(req,res)=>{
  console.log("Authorization header:", req.headers.authorization);
  res.json({
    message:"Your are authenticated",
    userId: req.userId,
  });
});




app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});