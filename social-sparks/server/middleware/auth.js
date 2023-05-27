import {User} from "../models/User.js";
import jwt from "jsonwebtoken";
import { catchAsyncError } from "./catchAsyncError.js";


const isAuthenticated = catchAsyncError(async (req, res, next) => {

    const {token} = req.cookies;
    
    if(!token){
        return res.status(401).json({
            message:"Please login first"
        }); 
    }
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded._id);
    next();
})

export default isAuthenticated;