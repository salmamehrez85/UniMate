import { useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { resetPassword } from "../services/authService";
import { LoginHeader } from "../components/Login/LoginHeader";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

export function ResetPassword({ resetToken, onBackToLogin }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError(t("auth.resetPassword.fillAllFields"));
      return;
    }
    if (password.length < 8) {
      setError(t("auth.resetPassword.passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.resetPassword.passwordsNoMatch"));
      return;
    }

    setLoading(true);
    try {
      await resetPassword(resetToken, password);
      setSuccess(true);
      // Clear token from URL without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      setError(err.message || t("auth.resetPassword.resetFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        <LoginHeader />

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-14 w-14 text-teal-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {t("auth.resetPassword.successTitle")}
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                {t("auth.resetPassword.successMessage")}
              </p>
              <button
                onClick={onBackToLogin}
                className="w-full bg-gradient-to-r from-[#54B3A4] to-[#163C60] text-white py-3 rounded-lg font-semibold hover:from-[#48a094] hover:to-[#0f2a45] transition cursor-pointer hover:scale-[1.02] active:scale-[0.98]">
                {t("auth.resetPassword.backToSignIn")}
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-1">
                {t("auth.resetPassword.pageTitle")}
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                {t("auth.resetPassword.description")}
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-sm font-medium text-gray-700 mb-2">
                    {t("auth.resetPassword.newPasswordLabel")}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full ps-10 pe-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      placeholder={t(
                        "auth.resetPassword.newPasswordPlaceholder",
                      )}
                      disabled={loading}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 end-0 pe-3 flex items-center cursor-pointer"
                      disabled={loading}>
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirm-new-password"
                    className="block text-sm font-medium text-gray-700 mb-2">
                    {t("auth.resetPassword.confirmPasswordLabel")}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirm-new-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full ps-10 pe-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      placeholder={t(
                        "auth.resetPassword.confirmPasswordPlaceholder",
                      )}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 end-0 pe-3 flex items-center cursor-pointer"
                      disabled={loading}>
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#54B3A4] to-[#163C60] text-white py-3 rounded-lg font-semibold hover:from-[#48a094] hover:to-[#0f2a45] focus:outline-none focus:ring-2 focus:ring-[#54B3A4] focus:ring-offset-2 transition cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading
                    ? t("auth.resetPassword.resetting")
                    : t("auth.resetPassword.resetButton")}
                </button>

                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium cursor-pointer hover:underline transition-colors duration-200 py-1">
                  {t("auth.resetPassword.backToSignIn")}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
