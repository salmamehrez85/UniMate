import { Logo } from "../Logo";
import { useTranslation } from "react-i18next";

export function RegisterHeader() {
  const { t } = useTranslation();
  return (
    <div className="text-center mb-8">
      <div className="flex justify-center mb-4">
        <Logo size="large" />
      </div>
      <h1 className="text-3xl font-bold text-primary-900 mb-2">
        {t("auth.register.title")}
      </h1>
      <p className="text-gray-600">{t("auth.register.subtitle")}</p>
    </div>
  );
}
