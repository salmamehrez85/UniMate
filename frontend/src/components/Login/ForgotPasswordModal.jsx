import { useState } from "react";
import { createPortal } from "react-dom";
import { Mail, X, CheckCircle } from "lucide-react";
import { forgotPassword } from "../../services/authService";
import { useTranslation } from "react-i18next";

export function ForgotPasswordModal({ onClose }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError(t("auth.forgotPassword.enterEmail"));
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || t("auth.forgotPassword.somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl relative p-10 md:p-12 border border-gray-100 transition-all duration-300 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 end-6 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          aria-label="Close">
          <X className="h-5 w-5" />
        </button>

        {sent ? (
          /* Success state */
          <div className="text-center py-4">
            <div className="flex justify-center mb-5">
              <CheckCircle className="h-16 w-16 text-[#54B3A4]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              {t("auth.forgotPassword.checkInbox")}
            </h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              {t("auth.forgotPassword.resetLinkSent", { email })}
            </p>
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-[#54B3A4] to-[#163C60] text-white py-3.5 rounded-xl font-semibold hover:from-[#48a094] hover:to-[#0f2a45] focus:outline-none focus:ring-2 focus:ring-[#54B3A4] focus:ring-offset-2 transition cursor-pointer hover:scale-[1.02] active:scale-[0.98]">
              {t("auth.forgotPassword.backToSignIn")}
            </button>
          </div>
        ) : (
          /* Form state */
          <>
            <div className="flex justify-center mb-5">
              <div className="bg-[#E8F8F5] border border-[#54B3A4]/30 rounded-full p-4 flex items-center justify-center">
                <Mail className="h-7 w-7 text-[#54B3A4]" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
              {t("auth.forgotPassword.title")}
            </h2>
            <p className="text-gray-500 text-sm text-center mb-8 max-w-sm mx-auto leading-relaxed">
              {t("auth.forgotPassword.description")}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-bold tracking-wider uppercase text-gray-500 mb-2">
                  {t("auth.forgotPassword.emailLabel")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4.5 w-4.5 text-gray-400" />
                  </div>
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full ps-10 pe-3 py-3.5 bg-gray-100/70 border border-gray-200 rounded-xl transition duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#54B3A4]/50 focus:border-[#54B3A4]"
                    placeholder={t("auth.forgotPassword.emailPlaceholder")}
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#54B3A4] to-[#163C60] text-white py-3.5 rounded-xl font-semibold hover:from-[#48a094] hover:to-[#0f2a45] focus:outline-none focus:ring-2 focus:ring-[#54B3A4] focus:ring-offset-2 transition cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                {loading
                  ? t("auth.forgotPassword.sending")
                  : t("auth.forgotPassword.sendReset")}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm text-gray-500 hover:text-[#54B3A4] font-semibold cursor-pointer hover:underline transition-colors duration-200 py-1">
                  {t("auth.forgotPassword.cancel")}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
