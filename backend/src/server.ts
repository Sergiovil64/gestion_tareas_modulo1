import express, { Request, Response } from "express";
import taskRoutes from "./routes/tasks.routes";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
    origin: process.env.FRONTEND_URL || "*", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json());
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);

app.get("/", (req: Request, res: Response) => {
    res.send("Bienvenidos al API de manejador de tareas");
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});