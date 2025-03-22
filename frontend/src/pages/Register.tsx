import { useState } from "react";
import { register } from "../api/auth";
import { useNavigate } from "react-router-dom";
import '../styles/Register.css';

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      navigate("/login");
    } catch (error) {
      alert("Error en registro");
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
        <form onSubmit={handleRegister}>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" required />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" required />
          <button type="submit">Registrar</button>
        </form>
      </div>
    </div>
  );
};

export default Register;