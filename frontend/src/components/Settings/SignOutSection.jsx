import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SignOutSection({ onLogout }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-3 px-4 rounded-lg font-semibold transition cursor-pointer">
        <LogOut className="w-5 h-5" />
        {t("settings.signOut")}
      </button>
    </div>
  );
}
