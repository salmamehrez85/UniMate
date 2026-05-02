import { useState } from "react";
import { User, Pencil, Check, X } from "lucide-react";
import { getUserData } from "../../services/authService";
import { useTranslation } from "react-i18next";

export function ProfileSection() {
  const { t } = useTranslation();
  const user = getUserData();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.fullName || "");
  const [university, setUniversity] = useState(user?.university || "");

  const handleSave = () => {
    // Persist locally for display (backend update can be wired later)
    const updated = { ...user, fullName: name, university };
    localStorage.setItem("userData", JSON.stringify(updated));
    setEditing(false);
  };

  const handleCancel = () => {
    setName(user?.fullName || "");
    setUniversity(user?.university || "");
    setEditing(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">{t("settings.profile.title")}</h3>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800 font-medium cursor-pointer transition-colors">
            <Pencil className="w-4 h-4" />
            {t("settings.profile.edit")}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("settings.profile.fullName")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("settings.profile.university")}
            </label>
            <input
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("settings.profile.email")}
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">
              {t("settings.profile.emailCannotChange")}
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 text-black text-sm font-semibold rounded-lg transition cursor-pointer">
              <Check className="w-4 h-4" />
              {t("settings.profile.save")}
            </button>
            <button
              onClick={handleCancel}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition cursor-pointer">
              <X className="w-4 h-4" />
              {t("settings.profile.cancel")}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-teal-500 flex items-center justify-center text-white text-xl font-bold select-none">
              {(user?.fullName || "U")[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {user?.fullName || "—"}
              </p>
              <p className="text-sm text-gray-500">{user?.email || "—"}</p>
              <p className="text-sm text-gray-500">{user?.university || "—"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
