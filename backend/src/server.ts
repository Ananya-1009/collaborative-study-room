import express from "express";
import cors from "cors";
const app = express();
const PORT = 5000;
app.use(cors());
app.use(express.json());
type Room={
  id:number,
  code:string,
  name:string,
  topic:string

}
const rooms:Room[]=[];
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Study Room API is running",
  });
});
app.post("/api/rooms",(req,res)=>{
  const { name, topic } = req.body;
  if(!name || !topic){
    return res.status(400).json({
      error: "Name and topic are required"
    });
  }
  const id=rooms.length+1;
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const newRoom:Room={
    id:id,
    code:code,
    name:name,
    topic:topic,
  };
  rooms.push(newRoom);
  res.status(201).json(newRoom);
})
app.get("/api/rooms",(req,res)=>{
  res.json(rooms);
})
app.get("/api/rooms/:id",(req,res)=>{
  const id=Number(req.params.id);
  const room=rooms.find((room)=>room.id===id);
  if(room==undefined){
    return res.status(400).json({
      error: "ROOM NOT FOUND"
    });
  }
  res.status(201).json(room);
})
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});