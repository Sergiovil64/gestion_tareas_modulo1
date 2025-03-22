import { Request, Response } from "express";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user";
import { AuthRequest } from "../middleware/auth.middleware";

// Registrar nuevo usuario
export const registerUser = async (req: Request, res: Response) => {
    // Validamos los datos recibidos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const {name, email, password} = req.body;
    const user = await User.findOne({ where: { email } });
    // Validamos que el usuario no existe previamente
    if (user) {
        res.status(400).json({ error: "El usuario ya existe" });
        return;
    }

    // Hasheando password
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserData = { name, email, password: hashedPassword };
    const newUser = await User.create(newUserData);

    res.json({ user: newUser, token: generateToken({id: newUser.id}) });
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Buscamos el usuario en la base de datos por su email
    const user = await User.findOne({ where: { email } });

    if (!user) {
        res.status(400).json({ message: "Usuario no encontrado" });
        return;
    }

    // Comparamos la contraseña ingresada con la almacenada en la base de datos
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        res.status(400).json({ message: "Contraseña incorrecta" });
        return;
    }

    // Generamos un token JWT con los datos del usuario
    const token = generateToken({id: user.id});

    // Enviamos el token al cliente
    res.json({ token });
};

export const me = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findOne({ where: { id: req.id } });
        if (!user) {
            res.status(404).json({ message: "Usuario no encontrado" });
            return;   
        }

        // Enviamos los datos del usuario autenticado
        res.json({user});
    } catch (error) {
        // En caso de error, informamos que el token es inválido o ha expirado
        res.status(401).json({ message: "Token inválido o expirado" });
    }
};

const generateToken = (userData: {id: number}) => {
    const secretKey: string = process.env.SECRET_KEY || "secret_key";
    const expiresIn: number = parseInt(process.env.EXPIRES_IN || "3600", 10)

    return jwt.sign(userData, secretKey, { expiresIn });
};  