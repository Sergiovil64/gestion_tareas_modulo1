import axios from "axios";

const API_URL = "https://gestion-tareas-modulo1.onrender.com/api/auth";

// Configurar interceptor para incluir el token en todas las peticiones
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Cambiar contraseña
export const changePassword = async (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
) => {
  try {
    const response = await axios.post(
      `${API_URL}/change-password`,
      { currentPassword, newPassword, confirmPassword },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Obtener estado de la contraseña
export const getPasswordStatus = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/password-status`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Forzar cambio de contraseña (Admin)
export const forcePasswordChange = async (userId: number) => {
  try {
    const response = await axios.post(
      `${API_URL}/force-password-change/${userId}`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

