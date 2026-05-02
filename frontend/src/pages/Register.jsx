import { RegisterHeader } from "../components/Register/RegisterHeader";
import { RegisterForm } from "../components/Register/RegisterForm";
import { RegisterFooter } from "../components/Register/RegisterFooter";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

export function Register({ onSwitchToLogin, onRegisterSuccess }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
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
