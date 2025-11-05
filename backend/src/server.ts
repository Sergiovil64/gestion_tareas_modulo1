// Maestrante: Juan Sergio Villafan Canizares

import express, { Request, Response, NextFunction } from "express";
import cors from 'cors';
import dotenv from "dotenv";
import { sequelize } from "./models/index";
import taskRoutes from "./routes/tasks.routes";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import { generalLimiter } from "./middleware/auth.middleware";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const env: string = process.env.NODE_ENV || 'development';

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general rate limiter to all routes
app.use(generalLimiter);

// Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Routes
// Health Check
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: "API de Gestión de Tareas",
    version: "2.0.0",
    endpoints: {
      auth: "/api/auth",
      tasks: "/api/tasks",
      admin: "/api/admin"
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    message: "El endpoint solicitado no existe",
    path: req.path
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error no controlado:", err);
  
  res.status(err.status || 500).json({
    error: "Error interno del servidor",
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : "Ha ocurrido un error inesperado. Por favor, contacte al administrador.",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Server Initialization
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Conexión a base de datos establecida correctamente');

    // Sync database models (in production, use migrations)
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✓ Modelos sincronizados con la base de datos');

    // Start server
    app.listen(PORT, () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log('Servidor iniciado correctamente');
      console.log(`${'='.repeat(60)}`);
      console.log(`URL: http://localhost:${PORT}`);
      console.log(`${'='.repeat(60)}\n`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer();

export default app;