import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { upgradeToPremium, currentUser } from "../api/auth";
import { getMFAStatus } from "../api/mfa";
import { FaCrown, FaUser, FaShieldAlt, FaArrowLeft, FaKey, FaLock } from "react-icons/fa";
import MFASetup from "../components/MFASetup";
import "../styles/Profile.css";

const Profile = () => {
  const { token, user, setUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // Actualizar información del usuario
    const fetchUser = async () => {
      try {
        const userData = await currentUser(token);
        setUser(userData);
      } catch (error) {
        console.error("Error al obtener usuario:", error);
      }
    };

    // Cargar estado de MFA
    const fetchMFAStatus = async () => {
      try {
        const status = await getMFAStatus();
        setMfaEnabled(status.mfaEnabled);
      } catch (error) {
        console.error("Error al obtener estado de MFA:", error);
      }
    };

    fetchUser();
    fetchMFAStatus();
  }, [token, navigate, setUser]);

  const handleUpgrade = async () => {
    if (!token) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await upgradeToPremium(token);
      setUser(response.user);
      setMessage("¡Felicitaciones! Tu cuenta ha sido actualizada a Premium");
      // Actualizar token con el nuevo rol
      if (response.token) {
        useAuthStore.getState().setToken(response.token);
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Error al actualizar cuenta");
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = () => {
    if (user?.role === 'ADMIN') return <FaShieldAlt className="role-icon-large admin" />;
    if (user?.role === 'PREMIUM') return <FaCrown className="role-icon-large premium" />;
    return <FaUser className="role-icon-large free" />;
  };

  const getRoleLabel = () => {
    if (user?.role === 'ADMIN') return "Administrador";
    if (user?.role === 'PREMIUM') return "Premium";
    return "Gratuito";
  };

  const isPremium = user?.role === 'PREMIUM' || user?.role === 'ADMIN';

  return (
    <div className="profile-container">
      <div className="profile-box">
        <Link to="/tasks" className="back-link">
          <FaArrowLeft /> Volver a tareas
        </Link>

        <div className="profile-header">
          {getRoleIcon()}
          <h2>Mi Perfil</h2>
        </div>

        <div className="profile-info">
          <div className="info-row">
            <span className="info-label">Nombre:</span>
            <span className="info-value">{user?.name}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">{user?.email}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Plan:</span>
            <span className={`info-value role-badge ${user?.role?.toLowerCase()}`}>
              {getRoleLabel()}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Estado:</span>
            <span className={`info-value ${user?.isActive ? "active" : "inactive"}`}>
              {user?.isActive ? "Activa" : "Inactiva"}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">MFA:</span>
            <span className={`info-value mfa-status ${mfaEnabled ? "enabled" : "disabled"}`}>
              {mfaEnabled ? "🔐 Activado" : "🔓 Desactivado"}
            </span>
          </div>
        </div>

        {message && (
          <div className={`message ${message.includes("Error") ? "error" : "success"}`}>
            {message}
          </div>
        )}

        <div className="security-section">
          <h3>🔐 Seguridad</h3>
          <div className="security-buttons">
            <button 
              className="security-btn"
              onClick={() => navigate("/change-password")}
            >
              <FaKey /> Cambiar Contraseña
            </button>
            <button 
              className="security-btn"
              onClick={() => setShowMFAModal(true)}
            >
              <FaLock /> Configurar MFA
            </button>
          </div>
        </div>

        {showMFAModal && (
          <div className="modal-overlay" onClick={() => setShowMFAModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <MFASetup onClose={() => {
                setShowMFAModal(false);
                getMFAStatus().then(status => setMfaEnabled(status.mfaEnabled)).catch(console.error);
              }} />
            </div>
          </div>
        )}

        {!isPremium && (
          <div className="upgrade-section">
            <h3>🚀 Actualiza a Premium</h3>
            <p className="upgrade-description">
              Desbloquea características exclusivas para mejorar tu gestión de tareas
            </p>

            <div className="features-list">
              <div className="feature-item">
                <span className="feature-icon">🎨</span>
                <div>
                  <strong>Colores Personalizados</strong>
                  <p>Dale color a tus tareas y organízalas visualmente</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🖼️</span>
                <div>
                  <strong>Imágenes en Tareas</strong>
                  <p>Agrega imágenes para identificar rápidamente tus tareas</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⭐</span>
                <div>
                  <strong>Sistema de Prioridades</strong>
                  <p>Organiza tus tareas por nivel de importancia</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <div>
                  <strong>Filtros Avanzados</strong>
                  <p>Encuentra tus tareas más rápido con filtros mejorados</p>
                </div>
              </div>
            </div>

            <button
              className="upgrade-btn"
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? "Procesando..." : "Actualizar a Premium Gratis"}
            </button>
            <p className="upgrade-note">Demo</p>
          </div>
        )}

        {isPremium && (
          <div className="premium-benefits">
            <h3>✨ Beneficios Activos</h3>
            <ul>
              <li>✅ Colores personalizados en tareas</li>
              <li>✅ Imágenes en tareas</li>
              <li>✅ Sistema de prioridades</li>
              <li>✅ Filtros avanzados</li>
              {user?.role === 'ADMIN' && (
                <>
                  <li>✅ Panel de administración</li>
                  <li>✅ Gestión de usuarios</li>
                  <li>✅ Estadísticas del sistema</li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

