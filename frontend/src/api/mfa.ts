import axios from "axios";

const API_URL = "https://gestion-tareas-modulo1.onrender.com/api/auth";

// Configurar interceptor para incluir el token en todas las peticiones
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Habilitar MFA y obtener código QR
export const enableMFA = async () => {
  try {
    const response = await axios.post(
      `${API_URL}/mfa/enable`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Verificar código MFA y activar
export const verifyMFA = async (token: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/mfa/verify`,
      { token },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Deshabilitar MFA
export const disableMFA = async (password: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/mfa/disable`,
      { password },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Obtener estado de MFA
export const getMFAStatus = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/mfa/status`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Regenerar códigos de respaldo
export const regenerateBackupCodes = async (password: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/mfa/regenerate-backup-codes`,
      { password },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

