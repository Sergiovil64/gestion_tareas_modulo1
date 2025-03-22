import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  id?: number;
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.token;

  if (!token) {
    res.status(401).json({ error: "Token no encontrado" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY as string || 'secret_key') as { id: number };
    req.id = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido" });
  }
};