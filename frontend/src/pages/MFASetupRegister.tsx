import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyMFASetup } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import "../styles/MFASetup.css";

interface LocationState {
  email: string;
  qrCode: string;
  secret: string;
  backupCodes: string[];
}

const MFASetupRegister = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const state = location.state as LocationState;

  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [backupCodesDownloaded, setBackupCodesDownloaded] = useState(false);

  if (!state || !state.email || !state.qrCode) {
    navigate("/register");
    return null;
  }

  const { email, qrCode, secret, backupCodes } = state;

  const handleVerifyMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!backupCodesDownloaded) {
      setError("Por favor, descargue los códigos de respaldo antes de continuar");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const result = await verifyMFASetup(email, verificationCode);
      setSuccess("¡MFA activado exitosamente! Redirigiendo...");
      
      setToken(result.token);
      setUser(result.user);
      
      setTimeout(() => {
        navigate("/tasks");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Código inválido. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const content = "CÓDIGOS DE RESPALDO - GUARDE EN LUGAR SEGURO\n\n" + 
                   backupCodes.join("\n") + 
                   "\n\nEstos códigos solo se muestran una vez. Guárdelos en un lugar seguro.";
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mfa-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
    setBackupCodesDownloaded(true);
    setSuccess("Códigos descargados correctamente");
  };

  const copyBackupCodes = () => {
    const content = backupCodes.join("\n");
    navigator.clipboard.writeText(content);
    setBackupCodesDownloaded(true);
    setSuccess("Códigos copiados al portapapeles");
  };

  return (
    <div className="mfa-setup-container">
      <div className="mfa-setup-box">
        <h2>🔐 Configuración de Autenticación de Dos Factores</h2>
        <p className="mfa-subtitle">Configure MFA para proteger su cuenta</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="mfa-verify">
          <div className="mfa-step">
            <h3>Paso 1: Descargue una aplicación de autenticación</h3>
            <p>Si aún no tiene una, descargue:</p>
            <ul>
              <li>Google Authenticator</li>
              <li>Microsoft Authenticator</li>
              <li>Authy</li>
            </ul>
          </div>

          <div className="mfa-step">
            <h3>Paso 2: Escanee el código QR</h3>
            {qrCode && <img src={qrCode} alt="QR Code" className="qr-code" />}
            <p className="secret-key">
              O ingrese manualmente este código: <br />
              <code>{secret}</code>
            </p>
          </div>

          <div className="mfa-step">
            <h3>Paso 3: Guarde los códigos de respaldo</h3>
            <p className="warning-text">
              ⚠️ Estos códigos solo se muestran una vez. Guárdelos en un lugar seguro.
            </p>
            <div className="backup-codes">
              {backupCodes.map((code, index) => (
                <div key={index} className="backup-code">
                  {code}
                </div>
              ))}
            </div>
            <div className="backup-actions">
              <button 
                onClick={downloadBackupCodes} 
                className="btn-secondary"
                disabled={backupCodesDownloaded}
              >
                {backupCodesDownloaded ? "✓ Descargados" : "Descargar Códigos"}
              </button>
              <button 
                onClick={copyBackupCodes} 
                className="btn-secondary"
                disabled={backupCodesDownloaded}
              >
                {backupCodesDownloaded ? "✓ Copiados" : "Copiar Códigos"}
              </button>
            </div>
          </div>

          <div className="mfa-step">
            <h3>Paso 4: Verifique el código</h3>
            <p>Ingrese el código de 6 dígitos de su aplicación de autenticación</p>
            <form onSubmit={handleVerifyMFA}>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
                className="mfa-code-input"
              />
              <button 
                type="submit" 
                disabled={loading || verificationCode.length !== 6 || !backupCodesDownloaded}
              >
                {loading ? "Verificando..." : "Verificar y Completar Registro"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MFASetupRegister;

