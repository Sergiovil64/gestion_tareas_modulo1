import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [requiresMFA, setRequiresMFA] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [tempUserId, setTempUserId] = useState<number | null>(null);
  const { token, setToken } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate("/tasks");
    }
  }, [token, navigate]);

  const { setUser } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await login(email, password, mfaToken);
      
      // Si requiere MFA, mostrar campo de código
      if (data.requiresMFA) {
        setRequiresMFA(true);
        setTempUserId(data.userId);
        alert("Por favor, ingrese el código de autenticación de su aplicación");
        return;
      }
      
      setToken(data.token);
      setUser(data.user);
      
      // Verificar si debe cambiar contraseña
      if (data.mustChangePassword) {
        alert(data.warning || "Debe cambiar su contraseña");
        navigate("/change-password");
        return;
      }
      
      // Mostrar advertencia si la contraseña está por expirar
      if (data.warning) {
        alert(data.warning);
      }
      
      console.log("Se ha logueado correctamente ", data.token);
    } catch (error: any) {
      const message = error.response?.data?.message || "Ha ocurrido un error al loguearse";
      alert(message);
      
      // Si el código MFA es inválido, permitir reintentar
      if (requiresMFA && error.response?.status === 401) {
        setMfaToken("");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Control de Tareas</h1> 
        <h2>Iniciar Sesión</h2> 
        <form onSubmit={handleLogin}>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Email" 
            required 
            disabled={requiresMFA}
          />
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Contraseña" 
            required 
            disabled={requiresMFA}
          />
          
          {requiresMFA && (
            <div className="mfa-input">
              <label>Código de autenticación (6 dígitos)</label>
              <input 
                type="text" 
                value={mfaToken} 
                onChange={(e) => setMfaToken(e.target.value)} 
                placeholder="000000" 
                maxLength={8}
                required 
                autoFocus
              />
              <p className="mfa-help">
                Ingrese el código de su aplicación de autenticación o un código de respaldo
              </p>
            </div>
          )}
          
          <button type="submit">
            {requiresMFA ? "Verificar Código" : "Entrar"}
          </button>
          
          {requiresMFA && (
            <button 
              type="button" 
              onClick={() => {
                setRequiresMFA(false);
                setMfaToken("");
                setPassword("");
              }}
              className="btn-secondary"
            >
              Volver
            </button>
          )}
        </form>
        <div className="register-link">
          ¿Aún sin cuenta? <Link to="/register">Regístrate aquí</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
