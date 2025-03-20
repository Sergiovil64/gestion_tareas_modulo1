import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTasks } from "../api/task";
import { useAuthStore } from "../store/authStore";
import "../styles/Tasks.css";

interface Task {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  status: string;
}

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { token, logout } = useAuthStore();
  const navigate = useNavigate();

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
      } catch (error) {
        console.error("Error al obtener lista de tareas", error);
      }
    };

    fetchTasks();
  }, [token, search, statusFilter, startDate, endDate, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="tasks-container">
      <button className="logout-btn" onClick={handleLogout}>
        Cerrar Sesión
      </button>
      <h2 className="tasklist-title">Mis Tareas</h2>

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
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="filter-by-end">
            <h5 className="filter-title">Seleccionar Fin</h5>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="tasks-grid">
        {tasks.length === 0 ? (
          <p style={{ color: "white" }}>No hay tareas disponibles.</p>
        ) : (
          tasks.map((task) => (
            <div className="task-card" key={task.id}>
              <div className="task-title">{task.title}</div>
              <div className="task-description">{task.description}</div>
              <div className={`task-status ${task.status.toLocaleLowerCase().replace(" ", "-")}`}>
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
    </div>
  );
};

export default Tasks;