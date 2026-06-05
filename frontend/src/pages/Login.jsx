import { LoginHeader } from "../components/Login/LoginHeader";
import { LoginForm } from "../components/Login/LoginForm";
import { LoginFooter } from "../components/Login/LoginFooter";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

export function Login({ onSwitchToRegister, onLoginSuccess }) {
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

      {/* Login card */}
      <div className="login-card">
        <LoginHeader />
        <LoginForm
          onSwitchToRegister={onSwitchToRegister}
          onLoginSuccess={onLoginSuccess}
        />
        <LoginFooter />
      </div>
    </div>
  );
}
