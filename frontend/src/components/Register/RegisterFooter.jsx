import { useTranslation } from "react-i18next";

export function RegisterFooter() {
  const { t } = useTranslation();
  return (
    <p className="text-center text-sm text-gray-600 mt-8">
      {t("auth.register.footer")}
    </p>
  );
}
