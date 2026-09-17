import {Router} from "express";
import pool from "../db.js";
import { authenticate } from "../middleware/auth.js";
import { requireRoomMember } from "../middleware/room.js";
import { requireRoomOwner } from "../middleware/roomOwner.js";
const router=Router();
function generateRoomCode(): string{
  return Math.random().toString(36).substring(2,8).toUpperCase();
}
router.post("/",authenticate,async(req,res)=>{
  const { name, topic } = req.body;
  if(typeof name!="string" || typeof topic!="string"){
    return res.status(400).json({
      error:"Invalid room data",
    });
  }
  const trimmedName=name.trim();
  const trimmedTopic=topic.trim();
  if(!trimmedName || !trimmedTopic){
    return res.status(400).json({
      error: "Name and topic are required"
    });
  }
  if(trimmedName.length>100 || trimmedTopic.length>100){
    return res.status(400).json({
      error:"Name and topic must be at most 100 characters",
    });
  }
  const code = generateRoomCode();
  const client=await pool.connect();
  try{
    for(let attempt=0;attempt<3;attempt++){
      const code=generateRoomCode();
        try{
          await client.query("BEGIN");
          const roomResult=await client.query(
            `INSERT INTO rooms(code,name,topic,owner_id) VALUES($1,$2,$3,$4)
            RETURNING *`,[code,trimmedName,trimmedTopic,req.userId]
          );
          await client.query(`INSERT INTO room_members(user_id,room_id) values($1,$2)`,[req.userId,roomResult.rows[0].id]);
          await client.query("COMMIT");
          return res.status(201).json(roomResult.rows[0]);
        }catch(error:any){
          await client.query("ROLLBACK");
          if(error.code!=="23505"){
            throw error
          }
        }
    }
    return res.status(500).json({
      error:"Could not genrate a unique room code",
    });
  }catch(error){
    console.error("Failed to create room:",error);
    res.status(500).json({
      error:"Failed to create",
    });
  }
  finally{
    client.release();
  }
});
router.get("/",authenticate,async(req,res)=>{
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
router.get("/:id",authenticate,requireRoomMember,async(req,res)=>{
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
router.post("/join",authenticate,async(req,res)=>{
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
router.get("/:id/members",authenticate,requireRoomMember,async(req,res)=>{
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
router.post(":id/leave",authenticate,requireRoomMember,async(req,res)=>{
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
router.delete("/:id",authenticate,requireRoomOwner,async(req,res)=>{
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
router.patch("/:id",authenticate,requireRoomOwner,async(req,res)=>{
  const roomId=Number(req.params.id);
  const{name,topic,description}=req.body
  if (
    typeof name !== "string" ||
    typeof topic !== "string" ||
    (description !== undefined && typeof description !== "string")
  ) {
    return res.status(400).json({
      error: "Invalid room data",
    });
  }
  const trimmedName=name?.trim();
  const trimmedTopic=topic?.trim();
  const trimmedDescription=description?.trim();
  if(!trimmedName || !trimmedTopic){
    return res.status(400).json({
      error:"Name and topic are required",
    });
  }
  if(trimmedName.length>100 || trimmedTopic.length>100){
    return res.status(400).json({
      error:"Name and topic must be at most 100 charchters",
    });
  }
  if(description && description.length>500){
    return res.status(400).json({
      error:"Description must be at most 500 charcters",
    });
  }
  try{
    const result=await pool.query(
      `Update rooms set name=$1,topic=$2,description=$3 where id=$4 returning *`,[trimmedName,trimmedTopic,trimmedDescription ?? null,roomId]
    );
    if(result.rows.length===0){
      return res.status(404).json({
        error:"Room not found",
      });
    }
    res.json(result.rows[0]);
  }catch(error){
    console.error("Failed to update room:",error);
    res.status(500).json({
      error:"Failed to update room",
    });
  }
})
export default router;