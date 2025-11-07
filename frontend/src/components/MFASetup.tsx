import { useState, useEffect } from "react";
import { enableMFA, verifyMFA, disableMFA, getMFAStatus, regenerateBackupCodes } from "../api/mfa";
import "../styles/MFASetup.css";

interface MFASetupProps {
  onClose?: () => void;
}

const MFASetup = ({ onClose }: MFASetupProps) => {
  const [step, setStep] = useState<"status" | "enable" | "verify" | "disable">("status");
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [backupCodesRemaining, setBackupCodesRemaining] = useState(0);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Cargar estado de MFA al montar el componente
  useEffect(() => {
    loadMFAStatus();
  }, []);

  const loadMFAStatus = async () => {
    try {
      const status = await getMFAStatus();
      setMfaEnabled(status.mfaEnabled);
      setBackupCodesRemaining(status.backupCodesRemaining);
    } catch (err: any) {
      console.error("Error al cargar estado de MFA:", err);
    }
  };

  const handleEnableMFA = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await enableMFA();
      setQrCode(response.qrCode);
      setSecret(response.secret);
      setBackupCodes(response.backupCodes);
      setStep("verify");
      setSuccess("MFA configurado. Por favor, escanee el código QR.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al habilitar MFA");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await verifyMFA(verificationCode);
      setSuccess("¡MFA activado exitosamente!");
      setMfaEnabled(true);
      setTimeout(() => {
        setStep("status");
        setVerificationCode("");
        if (onClose) onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Código inválido");
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await disableMFA(password);
      setSuccess("MFA deshabilitado exitosamente");
      setMfaEnabled(false);
      setPassword("");
      setTimeout(() => {
        setStep("status");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al deshabilitar MFA");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    const pwd = prompt("Ingrese su contraseña para regenerar códigos de respaldo:");
    if (!pwd) return;

    setLoading(true);
    setError("");
    try {
      const response = await regenerateBackupCodes(pwd);
      setBackupCodes(response.backupCodes);
      setSuccess("Códigos de respaldo regenerados");
      alert("Códigos regenerados:\n\n" + response.backupCodes.join("\n") + "\n\nGuárdelos en un lugar seguro.");
      await loadMFAStatus();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al regenerar códigos");
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mfa-backup-codes.txt";
    a.click();
  };

  return (
    <div className="mfa-setup-container">
      <div className="mfa-setup-box">
        <h2>🔐 Autenticación de Dos Factores (MFA)</h2>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {step === "status" && (
          <div className="mfa-status">
            <div className={`status-badge ${mfaEnabled ? "enabled" : "disabled"}`}>
              {mfaEnabled ? "✓ MFA Habilitado" : "✗ MFA Deshabilitado"}
            </div>
            
            {mfaEnabled ? (
              <>
                <p>La autenticación de dos factores está activa en su cuenta.</p>
                <p>Códigos de respaldo restantes: <strong>{backupCodesRemaining}</strong></p>
                
                <div className="mfa-actions">
                  <button onClick={handleRegenerateBackupCodes} disabled={loading}>
                    Regenerar Códigos de Respaldo
                  </button>
                  <button 
                    onClick={() => setStep("disable")} 
                    className="btn-danger"
                    disabled={loading}
                  >
                    Deshabilitar MFA
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>Proteja su cuenta con autenticación de dos factores.</p>
                <p>Necesitará una aplicación de autenticación como Google Authenticator o Authy.</p>
                
                <button onClick={handleEnableMFA} disabled={loading}>
                  {loading ? "Configurando..." : "Habilitar MFA"}
                </button>
              </>
            )}

            {onClose && (
              <button onClick={onClose} className="btn-secondary">
                Cerrar
              </button>
            )}
          </div>
        )}

        {step === "verify" && (
          <div className="mfa-verify">
            <h3>Paso 1: Escanee el código QR</h3>
            {qrCode && <img src={qrCode} alt="QR Code" className="qr-code" />}
            
            <p>Escanee este código con su aplicación de autenticación</p>
            <p className="secret-key">O ingrese manualmente: <code>{secret}</code></p>

            <h3>Paso 2: Guarde los códigos de respaldo</h3>
            <div className="backup-codes">
              {backupCodes.map((code, index) => (
                <div key={index} className="backup-code">{code}</div>
              ))}
            </div>
            <button onClick={downloadBackupCodes} className="btn-secondary">
              Descargar Códigos
            </button>

            <h3>Paso 3: Verifique el código</h3>
            <form onSubmit={handleVerifyMFA}>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Código de 6 dígitos"
                maxLength={6}
                required
                autoFocus
              />
              <button type="submit" disabled={loading || verificationCode.length !== 6}>
                {loading ? "Verificando..." : "Verificar y Activar"}
              </button>
              <button 
                type="button" 
                onClick={() => setStep("status")} 
                className="btn-secondary"
              >
                Cancelar
              </button>
            </form>
          </div>
        )}

        {step === "disable" && (
          <div className="mfa-disable">
            <h3>Deshabilitar MFA</h3>
            <p>Ingrese su contraseña para deshabilitar la autenticación de dos factores.</p>
            
            <form onSubmit={handleDisableMFA}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                required
                autoFocus
              />
              <button type="submit" disabled={loading} className="btn-danger">
                {loading ? "Deshabilitando..." : "Confirmar Deshabilitar"}
              </button>
              <button 
                type="button" 
                onClick={() => { setStep("status"); setPassword(""); }} 
                className="btn-secondary"
              >
                Cancelar
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default MFASetup;

