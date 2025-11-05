import { body, validationResult } from "express-validator";
import { Request, Response } from "express";
import { TaskStatus } from "../models/task";

// Validación de entradas para las rutas API de registro
export const registerValidationRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("El nombre es obligatorio")
    .isLength({ min: 2, max: 100 }).withMessage("El nombre debe tener entre 2 y 100 caracteres")
    .matches(/^[a-záéíóúñ\s]+$/i).withMessage("El nombre solo puede contener letras y espacios"),
  
  body("email")
    .trim()
    .notEmpty().withMessage("El email es obligatorio")
    .isEmail().withMessage("Debe ser un email válido")
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage("El email es demasiado largo"),
  
  body("password")
    .notEmpty().withMessage("La contraseña es obligatoria")
    .isLength({ min: 12, max: 128 }).withMessage("La contraseña debe tener entre 12 y 128 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/) // Solo se permiten @ $ ! % * ? &
    .withMessage("La contraseña debe contener al menos una mayúscula, una minúscula, un número y un caracter especial"),
];

// Validación de entradas para las rutas API de login
export const loginValidationRules = [
  body("email")
    .trim()
    .notEmpty().withMessage("El email es obligatorio")
    .isEmail().withMessage("Debe ser un email válido")
    .normalizeEmail(),
  
  body("password")
    .notEmpty().withMessage("La contraseña es obligatoria")
];

// Validación de entradas para las rutas API de creación de tareas
export const taskValidationRules = [
  body("title")
    .trim()
    .notEmpty().withMessage("El título es obligatorio")
    .isLength({ min: 3, max: 200 }).withMessage("El título debe tener entre 3 y 200 caracteres")
    .escape(), // Prevent XSS attacks
  
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("La descripción no puede exceder 1000 caracteres")
    .escape(),
  
  body("dueDate")
    .notEmpty().withMessage("La fecha de vencimiento es obligatoria")
    .isISO8601().withMessage("Formato de fecha no válido")
    .toDate()
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error("La fecha de vencimiento no puede ser en el pasado");
      }
      return true;
    }),
  
  body("priority")
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage("La prioridad debe ser un número entre 1 y 5"),
  
  body("color")
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage("El color debe ser un código hexadecimal válido"),
  
  body("imageUrl")
    .optional()
    .trim()
    .isURL().withMessage("Debe proporcionar una URL válida para la imagen")
];

// Validación de entradas para las rutas API de actualización de tareas
export const taskUpdateValidationRules = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage("El título debe tener entre 3 y 200 caracteres")
    .escape(),
  
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("La descripción no puede exceder 1000 caracteres")
    .escape(),
  
  body("status")
    .optional()
    .isIn(Object.values(TaskStatus)).withMessage("Estado de tarea inválido"),
  
  body("dueDate")
    .optional()
    .isISO8601().withMessage("Formato de fecha no válido")
    .toDate(),
  
  body("priority")
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage("La prioridad debe ser un número entre 1 y 5"),
  
  body("color")
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage("El color debe ser un código hexadecimal válido"),
  
  body("imageUrl")
    .optional()
    .trim()
    .isURL().withMessage("Debe proporcionar una URL válida para la imagen")
];

// Manejo de errores de validación para las rutas API
export const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      error: "Errores de validación",
      errors: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : 'unknown',
        message: err.msg
      }))
    });
    return true;
  }
  return false;
};

