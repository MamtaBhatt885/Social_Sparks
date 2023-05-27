import express from 'express';
import dotenv from 'dotenv';
import ErrorMiddleware from './middleware/Error.js';
import cookieParser from 'cookie-parser';

const app = express();

// Using middlewares
app.use(express.json({limit: "50mb"}));
app.use(express.urlencoded({ limit: "50mb", extended: true}));
app.use(cookieParser());

if(process.env.NODE_ENV !== "production"){

    dotenv.config({path: "server/config/config.env"})
}


// Importing routes
import post from "./routes/post.js";
import user from "./routes/user.js";

// Using Routes
app.use("/api/v1", post);
app.use("/api/v1", user);

export default app;


app.use(ErrorMiddleware);