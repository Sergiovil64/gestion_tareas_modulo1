import express, { Request, Response } from "express";
import taskRoutes from "./routes/tasks.routes";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);

app.get("/", (req: Request, res: Response) => {
    res.send("Bienvenidos al API de manejador de tareas");
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});