import express from "express";
import cors from "cors";
import pool from "./db.js";
import authRouter from "./routes/auth.js";
import { authenticate } from "./middleware/auth.js";
import { requireRoomMember } from "./middleware/room.js";
import { requireRoomOwner } from "./middleware/roomOwner.js";
import { Server } from "socket.io";
import roomRouter from "./routes/rooms.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken"
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
const httpServer=app.listen(PORT,()=>{
  console.log(`Server running on port ${PORT}`);
});
const io=new Server(httpServer,{
  cors:{
    origin:"http://localhost:5173",
    credentials:true,
  },
});
io.use((socket,next)=>{
  const token=socket.handshake.auth.token;
  if(!token){
    return next(new Error("Authentication required"));
  }
  try{
    const decoded=jwt.verify(token,process.env.JWT_SECRET as string) as {userId:number};
    socket.data.userId=decoded.userId;
    next();
  }catch(error){
    next(new Error("Invalid or expired token"));
  }
});
io.on("connection",(socket)=>{
  console.log("Socket connected",socket.id);
  socket.on("join-room",async(roomCode)=>{
    const roomName=`study-room-${roomCode}`;
    socket.join(roomName);
    socket.data.roomName=roomName;
    const result=await pool.query(
      `Select username from users where id=$1`,[socket.data.userId]
    );
    const username=result.rows[0]?.username;
    io.to(roomName).emit("user-joined",{
      userId:socket.data.userId,
      username,
    });
    console.log(
      `Socket ${socket.id} joined room ${roomName}`
    );
  });
  socket.on("disconnect",async()=>{
    const userId=socket.data.userId;
    const roomName=socket.data.roomName;
    console.log(`Socket disconnected: ${socket.id}, user: ${userId}`);
    const socketsInRoom=await io.in(roomName).fetchSockets();
    const userStillConnected=socketsInRoom.some(
      (connectedSocket)=>connectedSocket.data.userId===userId
    );
    console.log("User still connected:", userStillConnected);
    if(!userStillConnected){
      io.to(roomName).emit("user-left",{userId});
    }
  });
});
