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
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name Field */}
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-gray-700 mb-2">
            {t("auth.register.fullNameLabel")}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              className="block w-full ps-10 pe-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              placeholder={t("auth.register.fullNamePlaceholder")}
              disabled={loading}
            />
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2">
            {t("auth.register.emailLabel")}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="block w-full ps-10 pe-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              placeholder={t("auth.register.emailPlaceholder")}
              disabled={loading}
            />
          </div>
        </div>

        {/* University Field */}
        <div>
          <label
            htmlFor="university"
            className="block text-sm font-medium text-gray-700 mb-2">
            {t("auth.register.universityLabel")}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
              <GraduationCap className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="university"
              name="university"
              type="text"
              value={formData.university}
              onChange={handleChange}
              className="block w-full ps-10 pe-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              placeholder={t("auth.register.universityPlaceholder")}
              disabled={loading}
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2">
            {t("auth.register.passwordLabel")}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              className="block w-full ps-10 pe-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              placeholder={t("auth.register.passwordPlaceholder")}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 end-0 pe-3 flex items-center"
              disabled={loading}>
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-2">
            {t("auth.register.confirmPasswordLabel")}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              className="block w-full ps-10 pe-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              placeholder={t("auth.register.confirmPasswordPlaceholder")}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 end-0 pe-3 flex items-center"
              disabled={loading}>
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#54B3A4] to-[#163C60] text-white py-3 rounded-lg font-semibold hover:from-[#48a094] hover:to-[#0f2a45] focus:outline-none focus:ring-2 focus:ring-[#54B3A4] focus:ring-offset-2 transition cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
          {loading
            ? t("auth.register.creatingAccount")
            : t("auth.register.signUp")}
        </button>
      </form>

      {/* Divider */}
      <div className="mt-6 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">
            {t("auth.register.alreadyHaveAccount")}
          </span>
        </div>
      </div>

      {/* Login Link */}
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-primary-600 hover:text-primary-800 font-semibold cursor-pointer hover:underline transition-colors duration-200">
          {t("auth.register.signIn")}
        </button>
      </div>
    </div>
  );
}
