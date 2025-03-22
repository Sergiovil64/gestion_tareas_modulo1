import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTask, deleteTask, getTasks, updateTask } from "../api/task";
import { useAuthStore } from "../store/authStore";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { Task } from "./Task.interface";

import "../styles/Tasks.css";

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { token, setToken, logout } = useAuthStore();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

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
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        const data = await getTasks(token, params);
        setTasks(data);
      } catch (error: any) {
        if (error.status === 401) {
          setToken(null); 
          navigate("/login");
        }
        console.error("Error al obtener lista de tareas", error);
      }
    };

    fetchTasks();
  }, [token, search, statusFilter, startDate, endDate, navigate, setToken]);

  const openEditModal = (task: Task) => {
    const formattedDate = task.dueDate ? task.dueDate.split("T")[0] : "";
    setCurrentTask({...task, dueDate: formattedDate });
    setIsEditing(true);
  };

  const handleSaveTask = async () => {
    if (currentTask && token) {
      try {
        if (currentTask.id) {
          await updateTask(token, currentTask);
        } else {
          console.log(token);
          await createTask(token, currentTask);
        }
        closeEditModal();
        // Vuelve a cargar las tareas
        const data = await getTasks(token ?? '', new URLSearchParams());
        setTasks(data);
      } catch (error: any) {
        if (error.status === 401) {
          setToken(null); 
          navigate("/login");
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
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="tasks-container">
      <button className="logout-btn" onClick={handleLogout}>
        Cerrar Sesión
      </button>
      <div className="tasklist-header">
        <h2 className="tasklist-title">Mis Tareas</h2>
        <button className="tasklist-add-btn"
          onClick={() => {
            setCurrentTask({
              title: "",
              description: "",
              dueDate: ""
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
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filters-container">
          <div className="filter-by-status">
            <h5 className="filter-title">Filtrar por estado:</h5>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN PROGRESO">En Progreso</option>
              <option value="COMPLETADA">Completada</option>
            </select>
          </div>
          <div className="filter-by-start">
            <h5 className="filter-title">Seleccionar Inicio</h5>
            <input type="date" className="date-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="filter-by-end">
            <h5 className="filter-title">Seleccionar Fin</h5>
            <input type="date" className="date-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="tasks-grid">
        {tasks.length === 0 ? (
          <p className="no-tasks">No hay tareas disponibles.</p>
        ) : (
          tasks.map((task) => (
            <div className="task-card" key={task.id}>
              <div className="task-actions">
                <FaEdit className="edit-icon" onClick={() => openEditModal(task)} />
                <FaTrash className="delete-icon" onClick={() => handleDeleteTask(task)} />
              </div>
              <div className="task-title">{task.title}</div>
              <div className="task-description">{task.description}</div>
              <div className={`task-status ${task.status?.toLocaleLowerCase().replace(" ", "-")}`}>
                {task.status === "PENDIENTE"
                  ? "Pendiente"
                  : task.status === "EN PROGRESO"
                  ? "En Progreso"
                  : "Completada"}
              </div>
              {task.dueDate && <div className="task-due-date">Fecha límite: {task.dueDate}</div>}
            </div>
          ))
        )}
      </div>

      {isEditing && currentTask && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Editar Tarea</h3>
            <input
              type="text"
              value={currentTask.title}
              onChange={(e) => setCurrentTask({ ...currentTask, title: e.target.value })}
              placeholder="Título"
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
              </select>) : ''
            }
            <input
              type="date"
              value={currentTask.dueDate || ""}
              onChange={(e) => setCurrentTask({ ...currentTask, dueDate: e.target.value })}
            />
            <div className="modal-buttons">
              <button className="save-btn" onClick={handleSaveTask}>
                {currentTask.id ? "Guardar Cambios" : "Crear Tarea"}
              </button>
              <button className="cancel-btn" onClick={closeEditModal}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;