import multer from "multer";
import path from "path";
const storage=multer.diskStorage({
    destination:"uploads/",
    filename:(_req,file,cb)=>{
        const uniqueName=`${Date.now()}=${Math.round(
            Math.random()*1e9
        )}${path.extname(file.originalname)}`
        cb(null,uniqueName);
    },
});
const fileFilter:multer.Options["fileFilter"]=(
    _req,
    file,
    cb
)=>{
    if(file.mimetype==="application/pdf"){
        cb(null,true);
    }else{
        cb(new Error("Only PDF files are allowed"));
    }
};
const upload=multer({
    storage,
    fileFilter,
    limits:{
        fileSize:10*1024*1024,
    },
});
export default upload;