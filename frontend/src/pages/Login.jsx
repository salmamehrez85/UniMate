import { LoginHeader } from "../components/Login/LoginHeader";
import { LoginForm } from "../components/Login/LoginForm";
import { LoginFooter } from "../components/Login/LoginFooter";

export function Login({ onSwitchToRegister, onLoginSuccess }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
