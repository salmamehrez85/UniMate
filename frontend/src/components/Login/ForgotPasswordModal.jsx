import { useState } from "react";
import { Mail, X, CheckCircle } from "lucide-react";
import { forgotPassword } from "../../services/authService";

export function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          aria-label="Close">
          <X className="h-5 w-5" />
        </button>

        {sent ? (
          /* Success state */
          <div className="text-center py-4">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-14 w-14 text-teal-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Check your inbox</h2>
            <p className="text-gray-500 text-sm mb-6">
              If an account exists for <span className="font-medium text-gray-700">{email}</span>, a
              password reset link has been sent. The link expires in 15 minutes.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-[#54B3A4] to-[#163C60] text-white py-3 rounded-lg font-semibold hover:from-[#48a094] hover:to-[#0f2a45] transition cursor-pointer">
              Back to Sign In
            </button>
          </div>
        ) : (
          /* Form state */
          <>
            <div className="flex justify-center mb-4">
              <div className="bg-teal-100 rounded-full p-3">
                <Mail className="h-7 w-7 text-teal-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 text-center mb-1">Forgot your password?</h2>
            <p className="text-gray-500 text-sm text-center mb-6">
              Enter your email and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    placeholder="you@university.edu"
                    disabled={loading}
                    autoFocus
                  />
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
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium cursor-pointer hover:underline transition-colors duration-200 py-1">
                Cancel
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
