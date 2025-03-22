import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Tasks from "./pages/Tasks";
import useSession from "./store/authStore";

function App() {
  const { user, loading } = useSession();

  if (loading) return <p>Cargando sesión...</p>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={user ? "/tasks" : "/login"} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/tasks" element={<Tasks />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
