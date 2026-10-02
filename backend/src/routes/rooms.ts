import {Router} from "express";
import pool from "../db.js";
import { authenticate } from "../middleware/auth.js";
import { requireRoomMember } from "../middleware/room.js";
import { requireRoomOwner } from "../middleware/roomOwner.js";
import upload from "../middleware/upload.js"
import { io } from "../server.js"
import { release } from "node:os";
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
    const result=await pool.query(`SELECT DISTINCT r.*
   FROM rooms r
   JOIN room_members rm
     ON r.id = rm.room_id
   WHERE rm.user_id = $1
   ORDER BY r.id ASC`,
  [req.userId]);
    res.json(result.rows);
  }catch(error){
    console.error("Failed to fetch rooms:",error);
    res.status(500).json({
      error:"Failed to fetch rooms",
    });
  }
})
router.get("/code/:code",authenticate,async(req,res)=>{
  const {code}=req.params;
  try{
    const result=await pool.query(`Select r.* from rooms r join room_members rm on r.id=rm.room_id where r.code=$1 and rm.user_id=$2`,[code,req.userId]);
    if(result.rows.length===0){
      return res.status(404).json({
        error:"Room not found",
      });
    }
    res.json(result.rows[0]);
  }catch(error){
    console.error("Failed to fetch room:",error);
    res.status(500).json({
      error:"Failed to fetch room",
    });
  }
});
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
router.get("/:id/messages",authenticate,requireRoomMember,async(req,res)=>{
  const roomId=Number(req.params.id);
  try{
    const result=await pool.query(
      `SELECT messages.id,messages.content,messages.created_at,users.id as user_id,users.username from messages join users on users.id=messages.user_id where messages.room_id=$1 order by messages.created_at asc`,[roomId]
    );
    res.json(result.rows);
  }catch(error){
    console.error("Failed to fetch messages:",error);
    res.status(500).json({error:"Failed to fetch messages"});
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
console.log("START SESSION ROUTE REGISTERED");

router.post(
  "/:id/sessions/start",
  authenticate,
  requireRoomMember,
  async(req,res)=>{
    console.log("START SESSION HANDLER HIT");
    const roomId=Number(req.params.id);
    try{
      const activeSession=await pool.query(
        `Select id,started_at,started_by from study_sessions where room_id=$1 and ended_at is null`,[roomId]
      );
      if(activeSession.rows.length>0){
        return res.status(400).json({
          error:"A study session is already active",
        });
      }
      const result=await pool.query(
        `Insert into study_sessions(room_id,started_by) values($1,$2) returning id,room_id,started_by,started_at,ended_at`,[roomId,req.userId] 
      );
      res.status(201).json(result.rows[0]);
    }
    catch(error){
      console.error("Failed to start study session:",error);
      res.status(500).json({
        error:"Failed to start study session",
      });
    }
  }
);
router.get(
  "/:id/sessions/active",
  authenticate,
  requireRoomMember,
  async(req,res)=>{
    const roomId=Number(req.params.id);
    try{
      const result=await pool.query(
        `Select id,room_id,started_by,started_at,ended_at from study_sessions where room_id=$1 and ended_at is NULL`,[roomId]
      );
      if(result.rows.length===0){
        return res.json(null);
      }
      res.json(result.rows[0]);
    }catch(error){
      console.error("Failed to fetch active session:",error);
      res.status(500).json({
        error:"Failed to fetch active session",
      });
    }
  }
);
router.patch(
  "/:id/sessions/:sessionId/end",
  authenticate,
  requireRoomMember,
  async(req,res)=>{
    const sessionId=Number(req.params.sessionId);
    try{
      const result=await pool.query(
        `Update study_sessions set ended_at=Current_timestamp where id=$1 and started_by=$2 and ended_at is null returning id,room_id,started_by,started_at,ended_at`,[sessionId,req.userId]
      );
      if(result.rows.length===0){
        return res.status(404).json({
          error:"Active session not found or you cannot end it",
        });
      }
      res.json(result.rows[0]);
    }catch(error){
      console.error("Failed to end study session:",error);
      res.status(500).json({
        error:"Failed to end study session",
      });
    }
  }
);
router.get(
  "/:id/resources",
  authenticate,
  requireRoomMember,
  async(req,res)=>{
    const roomId=Number(req.params.id);
    try{
      const result=await pool.query(
        `Select id,title,url,resource_type,added_by,created_at from resources where room_id=$1 order by created_at ASC`,[roomId]
      );
      res.json(result.rows);
    }catch(error){
      console.error("Failed to fetch resources:",error);
      res.status(500).json({
        error:"Failed to fetch resources",
      });
    }
  }
);
router.post(
  "/:id/resources",
  authenticate,
  requireRoomMember,
  async(req,res)=>{
    const roomId=Number(req.params.id);
    const {title,url,resource_type}=req.body;
    const roomResult=await pool.query(
      `Select code from rooms where id=$1`,[roomId]
    );
    if(roomResult.rows.length===0){
      return res.status(404).json(
        {
          error:"Room not found",
        }
      );
    }
    const roomCode=roomResult.rows[0].code;
    if(!title || !resource_type){
      return res.status(400).json({
        error:"Title and resource type are required",
      });
    }
    try{
      const result=await pool.query(
        `Insert into resources (room_id,added_by,title,url,resource_type) values($1,$2,$3,$4,$5) returning id,room_id,added_by,title,url,resource_type,created_at`,[roomId,req.userId,title,url||null,resource_type]
      );
      io.to(`study-room-${roomCode}`).emit("new-resource",result.rows[0]);
      res.status(201).json(result.rows[0]);
    }catch(error){
      console.error("Failed to create resoucre:",error);
      res.status(500).json({
        error:"Failed to create resource",
      });
    }
  }
);
router.post(
  "/:id/resources/upload",
  authenticate,
  requireRoomMember,
  upload.single("file"),
  async (req,res)=>{
    const roomId=Number(req.params.id);
    if(!req.file){
      return res.status(400).json({
        eror:"PDF file is required",
      });
    }
    try{
      const result=await pool.query(
        `Insert into resources (room_id,added_by,title,url,resource_type) values($1,$2,$3,$4,$5) returning id,room_id,added_by,title,url,resource_type,created_at`,[
          roomId,
          req.userId,
          req.file.originalname,
          `/uploads/${req.file.filename}`,
          "pdf",
        ]
      );
      res.status(201).json(result.rows[0]);
    }catch(error){
      console.error("Failed to upload resources:",error);
      res.status(500).json({
        error:"Failed to upload resources",
      });
    }
  }
);
router.get(
  "/:id/problems",
  authenticate,
  requireRoomMember,
  async (req,res)=>{
    const roomId=Number(req.params.id);
    try{
      const result=await pool.query(
        `Select problems.id,problems.title,problems.url,problems.difficulty,problems.topic,problems.added_by,problems.created_at, EXISTS(Select 1 from problem_completions where problem_completions.problem_id=problems.id and problem_completions.user_id=$2) as completed from problems where problems.room_id=$1 order by problems.created_at asc`,
        [roomId,req.userId]
      );
      res.json(result.rows);
    }catch(error){
      console.error("Failed to fetch problems:",error);
      res.status(500).json({
        error:"Failed to fetch problems",
      });
    }
  }
);
router.post(
  "/:id/problems",
  authenticate,
  requireRoomMember,
  async (req,res)=>{
    const roomId=Number(req.params.id);
    const {title,url,difficulty,topic}=req.body;
    if(!title || !difficulty || !topic){
      return res.status(400).json({
        error:"Title,difficulty and topic are required",
      });
    }
    try {
      const result=await pool.query(
        `Insert into problems (room_id,added_by,title,url,difficulty,topic) values($1,$2,$3,$4,$5,$6) returning id,room_id,added_by,title,url,difficulty,topic,created_at`,[
          roomId,
          req.userId,
          title,
          url || null,
          difficulty,
          topic,
        ]
      );
      const roomResult=await pool.query(
        `Select code from rooms where id=$1`,
        [roomId]
      );
      if(roomResult.rows.length===0){
        return res.status(404).json({
          error:"Room not found",
        });
      }
      const roomCode=roomResult.rows[0].code;
      io.to(`study-room-${roomCode}`).emit(
        "new-problem",
        result.rows[0]
      );
      res.status(201).json(result.rows[0]);
    }catch(error){
      console.error("Failed to create problem:",error);
      res.status(500).json({
        error:"Failed to create problem",
      });
    }
  }
);
router.post("/:id/problems/:problemId/complete",authenticate,requireRoomMember,async(req,res)=>{
  const problemId=Number(req.params.problemId);
  if(!Number.isInteger(problemId) || problemId<=0){
    return res.status(400).json({
      error:"Invalid problem ID",
    });
  }
  try{
    const problemResult=await pool.query(`Select id from problems where id=$1 and room_id=$2`,[problemId,req.params.id]);
    if(problemResult.rows.length===0){
      return res.status(400).json({
        error:"Problem not found",
      });
    }
    const result=await pool.query(
      `Insert into problem_completions (problem_id,user_id) values($1,$2) on conflict(problem_id,user_id) do nothing returning problem_id,user_id,completed_at`,[problemId,req.userId]
    );
    res.status(201).json(
      result.rows[0] || {
        message:"Problem already completed",
      }
    );
    const roomResult=await pool.query(`Select code from rooms where id=$1`,[req.params.id]);
    const roomCode=roomResult.rows[0].code;
    io.to(`study-room-${roomCode}`).emit("problem-completed",{
      problemId,
      userId:req.userId,
    });
  }catch(error){
    console.error("Failed to complete problem:",error);
    res.status(500).json({
      error:"Failed to complete problem",
    });
  }
});
router.post("/:id/polls",authenticate,requireRoomMember,async(req,res)=>{
  const roomId=Number(req.params.id);
  const {question,options}=req.body;
  if(!question || !Array.isArray(options) || options.length<2){
    return res.status(400).json({
      error:"Question and at least two options are required",
    });
  }
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    const pollResult=await client.query(
      `Insert into polls (room_id,created_by,question) values($1,$2,$3) returning id,room_id,created_by,question,created_at`,[roomId,req.userId,question.trim()]
    );
    const poll=pollResult.rows[0];
    const createdOptions=[];
    for(const option of options){
      const optionResult=await client.query(`Insert into poll_options(poll_id,option_text) values($1,$2) returning id,poll_id,option_text`,[poll.id,option.trim()]);
      createdOptions.push(optionResult.rows[0]);
    }
    await client.query("COMMIT");
    res.status(201).json({
      ...poll,
      options:createdOptions,
    });
  }catch(error){
    await client.query("ROLLBACK");
    console.error("Failed to create poll:",error);
    res.status(500).json({
      error:"Failed to create poll",
    });
  }finally{
    client.release();
  }
})
export default router;