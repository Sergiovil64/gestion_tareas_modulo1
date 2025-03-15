import express, { Request, Response } from "express";
import taskRoutes from "./routes/tasks.routes";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/api', taskRoutes);

app.get("/", (req: Request, res: Response) => {
    res.send("Bienvenidos al API de manejador de tareas");
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});