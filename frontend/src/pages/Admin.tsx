import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { getAllUsers, getSystemStats, updateUserRole, toggleUserStatus } from "../api/admin";
import { User, SystemStats } from "./Task.interface";
import { FaArrowLeft, FaUsers, FaTasks, FaChartBar, FaCrown, FaUser, FaShieldAlt } from "react-icons/fa";
import "../styles/Admin.css";

const Admin = () => {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token || user?.role !== 'ADMIN') {
      navigate("/tasks");
      return;
    }

    fetchData();
  }, [token, user, navigate]);

  const fetchData = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const [usersData, statsData] = await Promise.all([
        getAllUsers(token),
        getSystemStats(token)
      ]);
      setUsers(usersData.users);
      setStats(statsData);
    } catch (error: any) {
      console.error("Error al cargar datos:", error);
      setMessage("Error al cargar datos del sistema");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    if (!token) return;

    try {
      await updateUserRole(token, userId, newRole);
      setMessage("Rol actualizado exitosamente");
      fetchData();
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Error al actualizar rol");
    }
  };

  const handleToggleStatus = async (userId: number) => {
    if (!token) return;

    try {
      await toggleUserStatus(token, userId);
      setMessage("Estado del usuario actualizado");
      fetchData();
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Error al cambiar estado");
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === 'ADMIN') return <FaShieldAlt className="role-icon admin" />;
    if (role === 'PREMIUM') return <FaCrown className="role-icon premium" />;
    return <FaUser className="role-icon free" />;
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <Link to="/tasks" className="back-link">
          <FaArrowLeft /> Volver a tareas
        </Link>
        <h1>Panel de Administración</h1>
      </div>

      {message && (
        <div className={`message ${message.includes("Error") ? "error" : "success"}`}>
          {message}
        </div>
      )}

      {/* Statistics Section */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card users">
            <div className="stat-icon">
              <FaUsers />
            </div>
            <div className="stat-content">
              <h3>Usuarios</h3>
              <div className="stat-number">{stats.users.total}</div>
              <div className="stat-details">
                <span className="stat-detail active">Activos: {stats.users.active}</span>
                <span className="stat-detail inactive">Inactivos: {stats.users.inactive}</span>
              </div>
            </div>
          </div>

          <div className="stat-card tasks">
            <div className="stat-icon">
              <FaTasks />
            </div>
            <div className="stat-content">
              <h3>Tareas</h3>
              <div className="stat-number">{stats.tasks.total}</div>
              <div className="stat-details">
                <span className="stat-detail">Pendientes: {stats.tasks.byStatus.pending}</span>
                <span className="stat-detail">En Progreso: {stats.tasks.byStatus.inProgress}</span>
                <span className="stat-detail">Completadas: {stats.tasks.byStatus.completed}</span>
              </div>
            </div>
          </div>

          <div className="stat-card roles">
            <div className="stat-icon">
              <FaChartBar />
            </div>
            <div className="stat-content">
              <h3>Por Rol</h3>
              <div className="role-stats">
                <div className="role-stat">
                  <FaShieldAlt className="role-icon admin" />
                  <span>Admin: {stats.users.byRole.admin}</span>
                </div>
                <div className="role-stat">
                  <FaCrown className="role-icon premium" />
                  <span>Premium: {stats.users.byRole.premium}</span>
                </div>
                <div className="role-stat">
                  <FaUser className="role-icon free" />
                  <span>Free: {stats.users.byRole.free}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="users-section">
        <h2>Gestión de Usuarios</h2>
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((usr) => (
                <tr key={usr.id} className={!usr.isActive ? "inactive-row" : ""}>
                  <td>{usr.id}</td>
                  <td>
                    <div className="user-name-cell">
                      {getRoleIcon(usr.role)}
                      {usr.name}
                    </div>
                  </td>
                  <td>{usr.email}</td>
                  <td>
                    <select
                      value={usr.role}
                      onChange={(e) => handleRoleChange(usr.id, e.target.value)}
                      disabled={usr.id === user?.id}
                      className={`role-select ${usr.role.toLowerCase()}`}
                    >
                      <option value="FREE">Free</option>
                      <option value="PREMIUM">Premium</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span className={`status-badge ${usr.isActive ? "active" : "inactive"}`}>
                      {usr.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`toggle-btn ${usr.isActive ? "deactivate" : "activate"}`}
                      onClick={() => handleToggleStatus(usr.id)}
                      disabled={usr.id === user?.id}
                    >
                      {usr.isActive ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;

