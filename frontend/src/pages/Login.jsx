import { LoginHeader } from "../components/Login/LoginHeader";
import { LoginForm } from "../components/Login/LoginForm";
import { LoginFooter } from "../components/Login/LoginFooter";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

export function Login({ onSwitchToRegister, onLoginSuccess }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
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
