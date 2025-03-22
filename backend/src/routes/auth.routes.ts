import express from "express";
import { login, logout, me, registerUser } from "../controllers/auth.controller";
import { body } from "express-validator";
import { verifyToken } from "../middleware/auth.middleware";

const authRouter = express.Router(); 

authRouter.post('/register', [
    body("name").notEmpty().withMessage("El nombre es obligatorio"),
    body("email").isEmail().withMessage("Debe ser un email válido"),
    body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres")
], registerUser);
authRouter.post('/login', login);
authRouter.get('/me', verifyToken, me);
authRouter.post('/logout', verifyToken, logout);


export default authRouter; 