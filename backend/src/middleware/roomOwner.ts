import {Request,Response,NextFunction} from "express";
import pool from "../db.js"
export async function requireRoomOwner(req:Request,res:Response,next:NextFunction
) {
    const roomId=Number(req.params.id);
    if (!Number.isInteger(roomId) || roomId <= 0) {
        return res.status(400).json({
            error: "Invalid room ID",
        });
    }
    try{
        const result=await pool.query(`Select 1 from rooms where id=$1 and owner_id=$2`,[roomId,req.userId]);
        if(result.rows.length===0){
            return res.status(403).json({
                error:"Only the room owner can perform this action",
            });
        }
        next();
    }catch(error){
        console.error("Room owner check failed:",error);
        return res.status(500).json({
            error:"Failed to check room ownership",
        });
    }
    
}