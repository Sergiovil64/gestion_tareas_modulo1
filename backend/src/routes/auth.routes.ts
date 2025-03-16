import express from "express";
import { login, me, registerUser } from "../controllers/auth.controller";

const authRouter = express.Router(); 

authRouter.post('/register', registerUser); 
authRouter.post('/login', login);
authRouter.get('/me', me);


export default authRouter; 