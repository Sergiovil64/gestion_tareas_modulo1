import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { token, setToken } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate("/tasks");
    }
  }, [token, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      setToken(data.token);
      console.log("Se ha logueado correctamente ", data.token);
    } catch (error) {
      alert("Ha ocurrido un error al loguearse. Por favor intente nuevamente");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Control de Tareas</h1> 
        <h2>Iniciar Sesión</h2> 
        <form onSubmit={handleLogin}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" required />
          <button type="submit">Entrar</button>
        </form>
        <div className="register-link">
          ¿Aún sin cuenta? <Link to="/register">Regístrate aquí</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
