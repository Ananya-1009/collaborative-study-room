import { Router } from "express";
import bcrypt from "bcrypt"
import pool from "../db.js"
import jwt from "jsonwebtoken";
const router=Router();
router.post("/register",async(req,res)=>{
    const{ username,email,password}=req.body;
    if(!username || !email || !password){
        return res.status(400).json({
            error:"Username,email and password are required",
        });
    }
    if (username.length < 3) {
        return res.status(400).json({
            error: "Username must be at least 3 characters",
        });
    }
    if(password.length<8){
        return res.status(400).json({
            error:"Password must be at least 8 charcters",
        });
    }
    if (!email.includes("@")) {
        return res.status(400).json({
            error: "Invalid email address",
        });
    }
    try{
        const passwordHash=await bcrypt.hash(password,10);
        const result=await pool.query(`INSERT INTO users(username,email,password_hash) values($1,$2,$3) returning id,username,email,created_at`,[username,email,passwordHash]);
        res.status(201).json(result.rows[0]);
    }catch(error:any){
        if(error.code==="23505"){
            return res.status(409).json({
                error:"Username or email already exists",
            });
        }
        console.error("Registration failed:",error);
        res.status(500).json({
            error:"Registration failed",
        });
    }
});
router.post("/login",async(req,res)=>{
    const {email,password}=req.body;
    if(!email || !password){
        return res.status(400).json({
            error: "Email and password are required",
        });
    }
    try{
        const result=await pool.query(`Select id,username,email,password_hash from users where email=$1`,[email]);
        if(result.rows.length===0){
            return res.status(401).json({
                error:"Invalid email or password",
            });
        }
        const user=result.rows[0];
        const passwordMatches=await bcrypt.compare(password,user.password_hash);
        if(!passwordMatches){
            return res.status(401).json({
                error:"Invalid email or password",
            });
        }
        const accessToken=jwt.sign(
            {userId: user.id},
            process.env.JWT_SECRET as string,
            {expiresIn:"15m",}
        );
        const refreshToken=jwt.sign(
            {userId:user.id},
            process.env.JWT_SECRET as string,
            {expiresIn:"7d"}
        )
        res.cookie("refreshToken",refreshToken,{
            httpOnly:true,
            secure:false,
            sameSite:"lax",
            maxAge:7*24*60*60*1000,
        });
        res.json({
            accessToken,
            user:{
                id:user.id,
                username:user.username,
                email:user.email,
            },
        });
    }catch(error){
        console.error("Login failed:",error);
        res.status(500).json({
            error:"Login failed",
        });
    }
});
router.post("/refresh",(req,res)=>{
    const refreshToken=req.cookies.refreshToken;
    if(!refreshToken){
        return res.status(401).json({
            error:"Refresh token missing",
        });
    }
    try{
        const decoded=jwt.verify(
            refreshToken,
            process.env.JWT_SECRET as string
        ) as {userId:number};
        const accessToken=jwt.sign(
            {userId:decoded.userId},
            process.env.JWT_SECRET as string,
            {expiresIn:"15m"}
        )
        res.json({
            accessToken,
        });
    }catch(error){
        return res.status(401).json({
            error:"Invalid or expired refresh token",
        });
    }
});
export default router;