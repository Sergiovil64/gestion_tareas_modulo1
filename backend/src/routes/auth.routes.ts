import express from "express";
import { login, me, registerUser } from "../controllers/auth.controller";
import { body } from "express-validator";

const authRouter = express.Router(); 

authRouter.post('/register', [
    body("name").notEmpty().withMessage("El nombre es obligatorio"),
    body("email").isEmail().withMessage("Debe ser un email válido"),
    body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres")
], registerUser);
authRouter.post('/login', login);
authRouter.get('/me', me);


export default authRouter; 