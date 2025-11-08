import express from "express";
import { login, me, registerUser, upgradeToPremium, verifyMFASetup } from "../controllers/auth.controller";
import { verifyToken, registerLimiter, loginLimiter } from "../middleware/auth.middleware";
import { registerValidationRules, loginValidationRules } from "../validators/validators";
import { 
  enableMFA, 
  verifyAndEnableMFA, 
  disableMFA, 
  getMFAStatus,
  regenerateBackupCodes 
} from "../controllers/mfa.controller";
import { 
  changePassword, 
  forcePasswordChange, 
  getPasswordStatus 
} from "../controllers/password.controller";

const authRouter = express.Router(); 

// Authentication Routes
authRouter.post('/register', registerLimiter, registerValidationRules, registerUser);
authRouter.post('/verify-mfa-setup', verifyMFASetup);
authRouter.post('/login', loginLimiter, loginValidationRules, login);
authRouter.get('/me', verifyToken, me);
authRouter.post('/upgrade-to-premium', verifyToken, upgradeToPremium);

// MFA Routes
authRouter.post('/mfa/enable', verifyToken, enableMFA);
authRouter.post('/mfa/verify', verifyToken, verifyAndEnableMFA);
authRouter.post('/mfa/disable', verifyToken, disableMFA);
authRouter.get('/mfa/status', verifyToken, getMFAStatus);
authRouter.post('/mfa/regenerate-backup-codes', verifyToken, regenerateBackupCodes);

// Password Management Routes
authRouter.post('/change-password', verifyToken, changePassword);
authRouter.get('/password-status', verifyToken, getPasswordStatus);
authRouter.post('/force-password-change/:userId', verifyToken, forcePasswordChange);

export default authRouter;