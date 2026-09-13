import express from "express";
import cors from "cors";
import pool from "./db.js";
import authRouter from "./routes/auth.js";
import { authenticate } from "./middleware/auth.js";
import { requireRoomMember } from "./middleware/room.js";
import { requireRoomOwner } from "./middleware/roomOwner.js";
const app = express();
const PORT = 5000;
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRouter);
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Study Room API is running",
  });
});
app.post("/api/rooms",authenticate,async(req,res)=>{
  const { name, topic } = req.body;
  if(!name || !topic){
    return res.status(400).json({
      error: "Name and topic are required"
    });
  }
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  try{
    const result=await pool.query(
      `INSERT INTO rooms(code,name,topic,owner_id) VALUES($1,$2,$3,$4)
      RETURNING *`,[code,name,topic,req.userId]
    );
    await pool.query(`INSERT INTO room_members(user_id,room_id) values($1,$2)`,[req.userId,result.rows[0].id]);
    res.status(201).json(result.rows[0]);
  }catch(error){
    console.error("Failed to create room:",error);
    res.status(500).json({
      error:"Failed to create",
    });
  }
});
app.post("/api/rooms/join",authenticate,async(req,res)=>{
  const {code}=req.body;
  if(!code){
    return res.status(400).json({
      error:"Room code is required",
    });
  }
  if(code.length!==6){
    return res.status(400).json({
      error:"Room code must be 6 characters",
    });
  }
  try{
    const result=await pool.query(
      `Select * from rooms where UPPER(code)=UPPER($1)`,[code]
    );
    if(result.rows.length===0){
      return res.status(404).json({
        error:"Room not found",
      });
    }
    const room=result.rows[0];
    await pool.query(`INSERT INTO room_members(user_id,room_id) values($1,$2) on conflict(user_id,room_id) do nothing`,[req.userId,room.id]);
    res.json(room);
  }catch(error){
    console.error("Failed to find room:",error);
    return res.status(500).json({
      error:"Failed to join room",
    });
  }
});
app.post("/api/rooms/:id/leave",authenticate,requireRoomMember,async(req,res)=>{
  const roomId=Number(req.params.id);
  try{
    const result=await pool.query(`Delete from room_members where room_id=$1 and user_id=$2 returning *`,[roomId,req.userId]);
    if(result.rows.length===0){
      return res.status(404).json({
        error:"Membership not found",
      });
    }
    res.json({
      message:"Leave room endpoint reached",
    });
  }catch(error){
    console.error("Failed to leave room:",error);
    res.status(500).json({
      error:"Failed to leave room",
    });
  }
});
app.get("/api/profile",authenticate,(req,res)=>{
  console.log("Authorization header:", req.headers.authorization);
  res.json({
    message:"Your are authenticated",
    userId: req.userId,
  });
});
app.get("/api/rooms",authenticate,async(req,res)=>{
  try{
    const result=await pool.query("Select * from rooms order by id asc");
    res.json(result.rows);
  }catch(error){
    console.error("Failed to fetch rooms:",error);
    res.status(500).json({
      error:"Failed to fetch rooms",
    });
  }
})
app.get("/api/rooms/:id",authenticate,requireRoomMember,async(req,res)=>{
  const id=Number(req.params.id);
  try{
    const result=await pool.query("Select * from rooms where id=$1",[id]);
    if(result.rows.length===0){
      return res.status(404).json({error:"ROOM NOT FOUND",});
    }
    res.json(result.rows[0]);
  }
  catch(error){
    console.error("Failed to fetch room:",error);
    res.status(500).json({
      error:"Failed to fetch room",
    });
  }
});
app.get("/api/rooms/:id/members",authenticate,requireRoomMember,async(req,res)=>{
  const roomId=Number(req.params.id);

  try{
    const result=await pool.query(
      `Select users.id,users.username from room_members join users on users.id=room_members.user_id where room_members.room_id=$1`,[roomId]
    );
    res.json(result.rows);
  }catch(error){
    console.error("Failed to fetch room members:",error);
    res.status(500).json({
      error:"Failed to fetch room members",
    });
  }
});
app.delete("/api/rooms/:id",authenticate,requireRoomOwner,async(req,res)=>{
  const roomId=Number(req.params.id);
  try{
    const result=await pool.query(`DELETE FROM rooms where id=$1 returning *`,[roomId]);
    if(result.rows.length===0){
      return res.status(404).json({
        error:"Room not found",
      });
    }
    res.json({
      message:"Room deleted successfully",
    });
  }catch(error){
    console.error("Failed to delete room:",error);
    res.status(500).json({
      error:"Failed to delete room",
    });
  }
});
app.patch("/api/rooms/:id",authenticate,requireRoomOwner,async(req,res)=>{
  const roomId=Number(req.params.id);
  try{
    res.json({
      message:"Update room endpoint reached",
    });
  }catch(error){
    console.error("Failed to update room:",error);
    res.status(500).json({
      error:"Failed to update room",
    });
  }
})
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});