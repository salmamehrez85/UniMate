import { SettingsHeader } from "../components/Settings/SettingsHeader";
import { ProfileSection } from "../components/Settings/ProfileSection";
import { NotificationsSection } from "../components/Settings/NotificationsSection";
import { PrivacySection } from "../components/Settings/PrivacySection";
import { AppearanceSection } from "../components/Settings/AppearanceSection";
import { SignOutSection } from "../components/Settings/SignOutSection";

export function Settings({ onLogout }) {
  return (
    <div className="mt-20">
      <div className="max-w-2xl mx-auto space-y-6">
        <SettingsHeader />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          <ProfileSection />
          <NotificationsSection />
          <PrivacySection />
          <AppearanceSection />
        </div>

        <SignOutSection onLogout={onLogout} />
      </div>
    </div>
  );
}
