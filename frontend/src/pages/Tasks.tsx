import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createTask, deleteTask, getTasks, updateTask } from "../api/task";
import { useAuthStore } from "../store/authStore";
import { FaEdit, FaTrash, FaPlus, FaCrown, FaUser, FaShieldAlt } from "react-icons/fa";
import { Task } from "./Task.interface";

import "../styles/Tasks.css";

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { token, user, setToken, logout } = useAuthStore();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [error, setError] = useState<string>("");

  const isPremium = user?.role === 'PREMIUM' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchTasks = async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (statusFilter) params.append("status", statusFilter);
        if (priorityFilter) params.append("priority", priorityFilter);
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        const data = await getTasks(token, params);
        setTasks(data);
      } catch (error: any) {
        if (error.response?.status === 401) {
          setToken(null);
          navigate("/login");
        }
        console.error("Error al obtener lista de tareas", error);
      }
    };

    fetchTasks();
  }, [token, search, statusFilter, priorityFilter, startDate, endDate, navigate, setToken]);

  const openEditModal = (task: Task) => {
    const formattedDate = task.dueDate ? task.dueDate.split("T")[0] : "";
    setCurrentTask({ ...task, dueDate: formattedDate });
    setIsEditing(true);
    setError("");
  };

  const handleSaveTask = async () => {
    if (currentTask && token) {
      setError("");
      
      // Validar características premium
      if (!isPremium && currentTask.color && currentTask.color !== '#FFFFFF') {
        setError("La personalización de colores está disponible solo para usuarios Premium");
        return;
      }
      if (!isPremium && currentTask.imageUrl) {
        setError("Agregar imágenes está disponible solo para usuarios Premium");
        return;
      }
      
      try {
        if (currentTask.id) {
          await updateTask(token, currentTask);
        } else {
          await createTask(token, currentTask);
        }
        closeEditModal();
        // Vuelve a cargar las tareas
        const data = await getTasks(token ?? '', new URLSearchParams());
        setTasks(data);
      } catch (error: any) {
        if (error.response?.status === 401) {
          setToken(null);
          navigate("/login");
        } else if (error.response?.status === 403) {
          setError(error.response.data.message || "No tienes permisos para esta acción");
        } else {
          setError("Error al guardar tarea: " + (error.response?.data?.message || error.message));
        }
        console.error("Error al guardar tarea:", error);
      }
    }
  };

  const handleDeleteTask = async (task: Task) => {
    const confirm = window.confirm("¿Estás seguro de que deseas eliminar esta tarea?");
    if (!confirm || !token || !task) return;

    try {
      await deleteTask(token, task);
      // Refrescar lista
      const data = await getTasks(token, new URLSearchParams());
      setTasks(data);
    } catch (error) {
      console.error("Error al eliminar tarea:", error);
    }
  };

  const closeEditModal = () => {
    setCurrentTask(null);
    setIsEditing(false);
    setError("");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getRoleIcon = () => {
    if (isAdmin) return <FaShieldAlt className="role-icon admin" title="Administrador" />;
    if (isPremium) return <FaCrown className="role-icon premium" title="Premium" />;
    return <FaUser className="role-icon free" title="Usuario Gratuito" />;
  };

  const getPriorityLabel = (priority?: number) => {
    if (!priority) return "";
    const labels = ["", "Muy Baja", "Baja", "Media", "Alta", "Muy Alta"];
    return labels[priority] || "";
  };

  // Función para determinar si un color es oscuro o claro
  const isColorDark = (hexColor: string): boolean => {
    if (!hexColor) return false;
    
    const hex = hexColor.replace('#', '');
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance < 0.5;
  };

  const getTextColor = (backgroundColor: string): string => {
    return isColorDark(backgroundColor) ? '#FFFFFF' : '#5D4037';
  };

  return (
    <div className="tasks-container">
      <div className="header-actions">
        <div className="user-info">
          {getRoleIcon()}
          <span className="user-name">{user?.name || "Usuario"}</span>
          {user?.role === 'FREE' && (
            <Link to="/profile" className="upgrade-link">
              Actualizar a Premium
            </Link>
          )}
        </div>
        <div className="nav-buttons">
          {isAdmin && (
            <Link to="/admin" className="admin-btn">
              Panel Admin
            </Link>
          )}
          <Link to="/profile" className="profile-btn">
            Mi Perfil
          </Link>
          <button className="logout-btn" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="tasklist-header">
        <h2 className="tasklist-title">Mis Tareas</h2>
        <button
          className="tasklist-add-btn"
          onClick={() => {
            setCurrentTask({
              title: "",
              description: "",
              dueDate: "",
              priority: 1,
              color: "#FFFFFF"
            });
            setIsEditing(true);
          }}
        >
          <FaPlus />
          Nueva tarea
        </button>
      </div>

      <div className="filters">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar por título o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filters-container">
          <div className="filter-by-status">
            <h5 className="filter-title">Estado:</h5>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN PROGRESO">En Progreso</option>
              <option value="COMPLETADA">Completada</option>
            </select>
          </div>
          <div className="filter-by-priority">
            <h5 className="filter-title">Prioridad:</h5>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="">Todas</option>
              <option value="1">Muy Baja</option>
              <option value="2">Baja</option>
              <option value="3">Media</option>
              <option value="4">Alta</option>
              <option value="5">Muy Alta</option>
            </select>
          </div>
          <div className="filter-by-start">
            <h5 className="filter-title">Desde:</h5>
            <input
              type="date"
              className="date-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="filter-by-end">
            <h5 className="filter-title">Hasta:</h5>
            <input
              type="date"
              className="date-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="tasks-grid">
        {tasks.length === 0 ? (
          <p className="no-tasks">No hay tareas disponibles.</p>
        ) : (
          tasks.map((task) => {
            const backgroundColor = task.color || '#FBE9E7';
            const textColor = getTextColor(backgroundColor);
            const isDark = isColorDark(backgroundColor);
            const iconBackgroundColor = isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.8)';
            
            return (
              <div
                className="task-card"
                key={task.id}
                style={{ backgroundColor, borderLeft: `5px solid ${task.color || '#8B5E3C'}` }}
              >
                <div className="task-actions">
                  <FaEdit 
                    className="edit-icon" 
                    onClick={() => openEditModal(task)}
                    style={{ backgroundColor: iconBackgroundColor }}
                  />
                  <FaTrash 
                    className="delete-icon" 
                    onClick={() => handleDeleteTask(task)}
                    style={{ backgroundColor: iconBackgroundColor }}
                  />
                </div>
                {task.imageUrl && (
                  <div className="task-image">
                    <img src={task.imageUrl} alt={task.title} />
                  </div>
                )}
                <div className="task-title" style={{ color: textColor }}>{task.title}</div>
                <div className="task-description" style={{ color: textColor }}>{task.description}</div>
                <div className="task-meta">
                  {task.priority && task.priority > 1 && (
                    <div className={`task-priority priority-${task.priority}`}>
                      ⭐ {getPriorityLabel(task.priority)}
                    </div>
                  )}
                  <div className={`task-status ${task.status?.toLocaleLowerCase().replace(" ", "-")}`}>
                    {task.status === "PENDIENTE"
                      ? "Pendiente"
                      : task.status === "EN PROGRESO"
                      ? "En Progreso"
                      : "Completada"}
                  </div>
                </div>
                {task.dueDate && (
                  <div className="task-due-date" style={{ color: textColor }}>
                    Vence: {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {isEditing && currentTask && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{currentTask.id ? "Editar Tarea" : "Nueva Tarea"}</h3>
            {error && <div className="error-message">{error}</div>}
            
            <input
              type="text"
              value={currentTask.title}
              onChange={(e) => setCurrentTask({ ...currentTask, title: e.target.value })}
              placeholder="Título *"
              required
            />
            <textarea
              value={currentTask.description}
              onChange={(e) => setCurrentTask({ ...currentTask, description: e.target.value })}
              placeholder="Descripción"
            />
            {currentTask.id ? (
              <select
                value={currentTask.status}
                onChange={(e) => setCurrentTask({ ...currentTask, status: e.target.value })}
              >
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN PROGRESO">En Progreso</option>
                <option value="COMPLETADA">Completada</option>
              </select>
            ) : null}
            <input
              type="date"
              value={currentTask.dueDate || ""}
              onChange={(e) => setCurrentTask({ ...currentTask, dueDate: e.target.value })}
              required
            />
            
            <label className="form-label">Prioridad</label>
            <select
              value={currentTask.priority || 1}
              onChange={(e) => setCurrentTask({ ...currentTask, priority: parseInt(e.target.value) })}
            >
              <option value="1">Muy Baja</option>
              <option value="2">Baja</option>
              <option value="3">Media</option>
              <option value="4">Alta</option>
              <option value="5">Muy Alta</option>
            </select>

            {isPremium && (
              <>
                <label className="form-label">
                  Color de la tarjeta <span className="premium-badge">Premium</span>
                </label>
                <input
                  type="color"
                  value={currentTask.color || "#FFFFFF"}
                  onChange={(e) => setCurrentTask({ ...currentTask, color: e.target.value })}
                />

                <label className="form-label">
                  URL de imagen <span className="premium-badge">Premium</span>
                </label>
                <input
                  type="url"
                  value={currentTask.imageUrl || ""}
                  onChange={(e) => setCurrentTask({ ...currentTask, imageUrl: e.target.value })}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </>
            )}

            {!isPremium && (
              <div className="premium-notice">
                <p>🔒 Actualiza a Premium para desbloquear:</p>
                <ul>
                  <li>Colores personalizados</li>
                  <li>Imágenes en tareas</li>
                </ul>
                <Link to="/profile" className="upgrade-link-modal">
                  Actualizar ahora
                </Link>
              </div>
            )}

            <div className="modal-buttons">
              <button className="save-btn" onClick={handleSaveTask}>
                {currentTask.id ? "Guardar Cambios" : "Crear Tarea"}
              </button>
              <button className="cancel-btn" onClick={closeEditModal}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
