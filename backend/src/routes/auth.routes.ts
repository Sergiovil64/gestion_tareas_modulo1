import express from "express";
import { login, me, registerUser, upgradeToPremium } from "../controllers/auth.controller";
import { verifyToken, registerLimiter, loginLimiter } from "../middleware/auth.middleware";
import { registerValidationRules, loginValidationRules } from "../validators/validators";

const authRouter = express.Router(); 

// Authentication Routes
authRouter.post('/register', registerLimiter, registerValidationRules, registerUser);
authRouter.post('/login', loginLimiter, loginValidationRules, login);
authRouter.get('/me', verifyToken, me);
authRouter.post('/upgrade-to-premium', verifyToken, upgradeToPremium);

export default authRouter;