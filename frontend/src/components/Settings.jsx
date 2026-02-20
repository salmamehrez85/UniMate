import { LogOut, User, Bell, Lock, Palette } from "lucide-react";

export function Settings({ onLogout }) {
  return (
    <div className="mt-20">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-primary-900 mb-2">Settings</h2>
          <p className="text-gray-600">Customize your UniMate experience</p>
        </div>

        {/* Settings Sections */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {/* Profile Settings */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Manage your account information and preferences
            </p>
          </div>

          {/* Notifications */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              Configure how you receive updates and reminders
            </p>
          </div>

          {/* Privacy */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Privacy</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Control your data and privacy settings
            </p>
          </div>

          {/* Appearance */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Palette className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Appearance
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              Customize the look and feel of UniMate
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-3 px-4 rounded-lg font-semibold transition">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
