import { useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { resetPassword } from "../services/authService";
import { LoginHeader } from "../components/Login/LoginHeader";

export function ResetPassword({ resetToken, onBackToLogin }) {
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
      setError("Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(resetToken, password);
      setSuccess(true);
      // Clear token from URL without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      setError(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginHeader />

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-14 w-14 text-teal-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Password updated!</h2>
              <p className="text-gray-500 text-sm mb-6">
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <button
                onClick={onBackToLogin}
                className="w-full bg-gradient-to-r from-[#54B3A4] to-[#163C60] text-white py-3 rounded-lg font-semibold hover:from-[#48a094] hover:to-[#0f2a45] transition cursor-pointer hover:scale-[1.02] active:scale-[0.98]">
                Sign In
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Set a new password</h2>
              <p className="text-gray-500 text-sm mb-6">
                Your new password must be at least 8 characters.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      placeholder="At least 8 characters"
                      disabled={loading}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
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
                  <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirm-new-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      placeholder="Re-enter your new password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
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
                  {loading ? "Resetting..." : "Reset Password"}
                </button>

                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium cursor-pointer hover:underline transition-colors duration-200 py-1">
                  Back to Sign In
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
