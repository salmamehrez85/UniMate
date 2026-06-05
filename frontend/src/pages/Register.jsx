import { RegisterHeader } from "../components/Register/RegisterHeader";
import { RegisterForm } from "../components/Register/RegisterForm";
import { RegisterFooter } from "../components/Register/RegisterFooter";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

export function Register({ onSwitchToLogin, onRegisterSuccess }) {
  return (
    <div className="login-scene">
      {/* Animated blobs */}
      <div className="login-scene-blob login-scene-blob-1" />
      <div className="login-scene-blob login-scene-blob-2" />
      <div className="login-scene-blob login-scene-blob-3" />

      {/* Language switcher top-right */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      {/* Register card */}
      <div className="login-card" style={{ maxWidth: "480px" }}>
        <RegisterHeader />
        <RegisterForm
          onSwitchToLogin={onSwitchToLogin}
          onRegisterSuccess={onRegisterSuccess}
        />
        <RegisterFooter />
      </div>
    </div>
  );
}
