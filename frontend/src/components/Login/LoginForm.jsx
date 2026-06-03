import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import {
  loginUser,
  setAuthToken,
  setUserData,
} from "../../services/authService";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { useTranslation } from "react-i18next";

export function LoginForm({ onSwitchToRegister, onLoginSuccess }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError(t("auth.login.fillAllFields"));
      setLoading(false);
      return;
    }

    try {
      const response = await loginUser({ email, password });
      setAuthToken(response.token);
      setUserData(response.user);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || t("auth.login.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-8 shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold tracking-wider uppercase text-gray-500 mb-2">
            {t("auth.login.emailLabel")}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none">
              <Mail className="h-4.5 w-4.5 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full ps-10 pe-3 py-3 bg-gray-100/70 dark:bg-slate-950/20 border border-gray-200 rounded-xl transition duration-200 text-sm"
              placeholder={t("auth.login.emailPlaceholder")}
              disabled={loading}
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-bold tracking-wider uppercase text-gray-500 mb-2">
            {t("auth.login.passwordLabel")}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none">
              <Lock className="h-4.5 w-4.5 text-gray-400" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full ps-10 pe-12 py-3 bg-gray-100/70 dark:bg-slate-950/20 border border-gray-200 rounded-xl transition duration-200 text-sm"
              placeholder={t("auth.login.passwordPlaceholder")}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 end-0 pe-3.5 flex items-center"
              disabled={loading}>
              {showPassword ? (
                <EyeOff className="h-4.5 w-4.5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-4.5 w-4.5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Forgot Password Link */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-xs text-primary-600 hover:text-primary-800 font-bold tracking-wider uppercase cursor-pointer transition-colors duration-200">
            {t("auth.login.forgotPassword")}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-3.5 text-sm font-bold mt-2">
          {loading ? t("auth.login.signingIn") : t("auth.login.signIn")}
        </button>
      </form>

      {/* Divider */}
      <div className="mt-6 text-center">
        <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
          {t("auth.login.dontHaveAccount")}
        </span>
      </div>

      {/* Register Link */}
      <div className="mt-4">
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="w-full btn-secondary py-3.5 text-sm font-bold">
          {t("auth.login.createAccount")}
        </button>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}
    </div>
  );
}
