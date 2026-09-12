import express from "express";
import cors from "cors";
import pool from "./db.js";
const app = express();
const PORT = 5000;
app.use(cors());
app.use(express.json());
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Study Room API is running",
  });
});
app.post("/api/rooms",async(req,res)=>{
  const { name, topic } = req.body;
  if(!name || !topic){
    return res.status(400).json({
      error: "Name and topic are required"
    });
  }
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  try{
    const result=await pool.query(
      `INSERT INTO rooms(code,name,topic) VALUES($1,$2,$3)
      RETURNING *`,[code,name,topic]
    );
    res.status(201).json(result.rows[0]);
  }catch(error){
    console.error("Failed to create room:",error);
    res.status(500).json({
      error:"Failed to create",
    });
  }
});
app.get("/api/rooms",async(req,res)=>{
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
app.get("/api/rooms/:id",async(req,res)=>{
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
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});