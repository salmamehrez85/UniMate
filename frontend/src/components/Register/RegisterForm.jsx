import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, GraduationCap } from "lucide-react";
import {
  registerUser,
  setAuthToken,
  setUserData,
} from "../../services/authService";
import { useTranslation } from "react-i18next";

export function RegisterForm({ onSwitchToLogin, onRegisterSuccess }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    university: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.university
    ) {
      setError(t("auth.register.fillAllFields"));
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t("auth.register.passwordsNoMatch"));
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError(t("auth.register.passwordTooShort"));
      setLoading(false);
      return;
    }

    try {
      // Call the actual register API
      const response = await registerUser({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        university: formData.university,
      });

      // Store token and user data
      setAuthToken(response.token);
      setUserData(response.user);

      // Call success callback
      if (onRegisterSuccess) {
        onRegisterSuccess();
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || t("auth.register.registrationFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-8 shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-4.5">
        {/* Full Name Field */}
        <div>
          <label
            htmlFor="fullName"
            className="block text-xs font-bold tracking-wider uppercase text-gray-500 mb-2">
            {t("auth.register.fullNameLabel")}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none">
              <User className="h-4.5 w-4.5 text-gray-400" />
            </div>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              className="block w-full ps-10 pe-3 py-3 bg-gray-100/70 dark:bg-slate-950/20 border border-gray-200 rounded-xl transition duration-200 text-sm"
              placeholder={t("auth.register.fullNamePlaceholder")}
              disabled={loading}
            />
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold tracking-wider uppercase text-gray-500 mb-2">
            {t("auth.register.emailLabel")}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none">
              <Mail className="h-4.5 w-4.5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="block w-full ps-10 pe-3 py-3 bg-gray-100/70 dark:bg-slate-950/20 border border-gray-200 rounded-xl transition duration-200 text-sm"
              placeholder={t("auth.register.emailPlaceholder")}
              disabled={loading}
            />
          </div>
        </div>

        {/* University Field */}
        <div>
          <label
            htmlFor="university"
            className="block text-xs font-bold tracking-wider uppercase text-gray-500 mb-2">
            {t("auth.register.universityLabel")}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none">
              <GraduationCap className="h-4.5 w-4.5 text-gray-400" />
            </div>
            <input
              id="university"
              name="university"
              type="text"
              value={formData.university}
              onChange={handleChange}
              className="block w-full ps-10 pe-3 py-3 bg-gray-100/70 dark:bg-slate-950/20 border border-gray-200 rounded-xl transition duration-200 text-sm"
              placeholder={t("auth.register.universityPlaceholder")}
              disabled={loading}
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-bold tracking-wider uppercase text-gray-500 mb-2">
            {t("auth.register.passwordLabel")}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none">
              <Lock className="h-4.5 w-4.5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              className="block w-full ps-10 pe-12 py-3 bg-gray-100/70 dark:bg-slate-950/20 border border-gray-200 rounded-xl transition duration-200 text-sm"
              placeholder={t("auth.register.passwordPlaceholder")}
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

        {/* Confirm Password Field */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-bold tracking-wider uppercase text-gray-500 mb-2">
            {t("auth.register.confirmPasswordLabel")}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none">
              <Lock className="h-4.5 w-4.5 text-gray-400" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              className="block w-full ps-10 pe-12 py-3 bg-gray-100/70 dark:bg-slate-950/20 border border-gray-200 rounded-xl transition duration-200 text-sm"
              placeholder={t("auth.register.confirmPasswordPlaceholder")}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 end-0 pe-3.5 flex items-center"
              disabled={loading}>
              {showConfirmPassword ? (
                <EyeOff className="h-4.5 w-4.5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-4.5 w-4.5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-3.5 text-sm font-bold mt-4">
          {loading
            ? t("auth.register.creatingAccount")
            : t("auth.register.signUp")}
        </button>
      </form>

      {/* Divider */}
      <div className="mt-6 text-center">
        <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
          {t("auth.register.alreadyHaveAccount")}
        </span>
      </div>

      {/* Login Link */}
      <div className="mt-4">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="w-full btn-secondary py-3.5 text-sm font-bold">
          {t("auth.register.signIn")}
        </button>
      </div>
    </div>
  );
}
