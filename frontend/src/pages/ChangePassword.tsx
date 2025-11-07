import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword, getPasswordStatus } from "../api/password";
import { useAuthStore } from "../store/authStore";
import "../styles/ChangePassword.css";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { token, setToken } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadPasswordStatus();
  }, [token, navigate]);

  const loadPasswordStatus = async () => {
    try {
      const status = await getPasswordStatus();
      setPasswordStatus(status);
    } catch (err: any) {
      console.error("Error al cargar estado de contraseña:", err);
    }
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 12 || password.length > 128) {
      return "La contraseña debe tener entre 12 y 128 caracteres";
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    if (!passwordRegex.test(password)) {
      return "La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)";
    }
    
    return null;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    // Validar complejidad de la nueva contraseña
    const validationError = validatePassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const response = await changePassword(currentPassword, newPassword, confirmPassword);
      setSuccess("Contraseña actualizada exitosamente");
      
      // Actualizar token si se devolvió uno nuevo
      if (response.token) {
        setToken(response.token);
      }
      
      // Limpiar campos
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate("/tasks");
      }, 2000);
    } catch (err: any) {
      const message = err.response?.data?.message || "Error al cambiar contraseña";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Solo permitir cancelar si no es obligatorio
    if (passwordStatus && !passwordStatus.mustChangePassword && !passwordStatus.isExpired) {
      navigate("/tasks");
    } else {
      alert("Debe cambiar su contraseña para continuar");
    }
  };

  return (
    <div className="change-password-container">
      <div className="change-password-box">
        <h2>🔐 Cambiar Contraseña</h2>

        {passwordStatus && passwordStatus.isExpired && (
          <div className="alert alert-danger">
            ⚠️ Su contraseña ha expirado. Debe cambiarla para continuar.
          </div>
        )}

        {passwordStatus && passwordStatus.mustChangePassword && !passwordStatus.isExpired && (
          <div className="alert alert-warning">
            ⚠️ Se requiere que cambie su contraseña.
          </div>
        )}

        {passwordStatus && passwordStatus.daysUntilExpiration !== null && 
         passwordStatus.daysUntilExpiration <= 7 && !passwordStatus.isExpired && (
          <div className="alert alert-info">
            ℹ️ Su contraseña expirará en {passwordStatus.daysUntilExpiration} días.
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label>Contraseña Actual</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Contraseña actual"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Nueva Contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nueva contraseña"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Confirmar Nueva Contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar nueva contraseña"
              required
              disabled={loading}
            />
          </div>

          <div className="password-requirements">
            <h4>Requisitos de la contraseña:</h4>
            <ul>
              <li>Mínimo 12 caracteres</li>
              <li>Al menos una mayúscula (A-Z)</li>
              <li>Al menos una minúscula (a-z)</li>
              <li>Al menos un número (0-9)</li>
              <li>Al menos un carácter especial (@$!%*?&)</li>
              <li>No puede ser igual a las últimas 5 contraseñas</li>
            </ul>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Cambiando..." : "Cambiar Contraseña"}
          </button>

          {passwordStatus && !passwordStatus.mustChangePassword && !passwordStatus.isExpired && (
            <button 
              type="button" 
              onClick={handleCancel} 
              className="btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
          )}
        </form>

        {passwordStatus && (
          <div className="password-info">
            <p>
              <strong>Política de contraseñas:</strong> Las contraseñas expiran cada {passwordStatus.expirationPolicy}
            </p>
            {passwordStatus.passwordChangedAt && (
              <p>
                <strong>Última modificación:</strong> {new Date(passwordStatus.passwordChangedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangePassword;

