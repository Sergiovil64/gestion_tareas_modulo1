import { useEffect, useState } from "react";
import { register } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import '../styles/Register.css';

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const {token, setToken, setUser} = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
      if (token) {
        navigate("/tasks");
      }
  }, [token, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      const result = await register(name, email, password);
      setToken(result.token);
      setUser(result.user);
      navigate("/tasks");
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || "Error en registro. La contraseña debe tener al menos 12 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales.";
      setError(message);
    }
  };

  const handleBack = () => {
    navigate("/login");
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <button className="back-button" onClick={handleBack}>Volver</button>
        <h2>Registro de usuarios</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleRegister}>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" required />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" required />
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar Contraseña" required />
          
          <div className="password-requirements">
            <h4>Requisitos de la contraseña:</h4>
            <ul>
              <li>Mínimo 12 caracteres</li>
              <li>Al menos una mayúscula (A-Z)</li>
              <li>Al menos una minúscula (a-z)</li>
              <li>Al menos un número (0-9)</li>
              <li>Al menos un carácter especial (@$!%*?&)</li>
            </ul>
          </div>
          
          <button type="submit">Registrar</button>
        </form>
      </div>
    </div>
  );
};

export default Register;