import { useTranslation } from "react-i18next";

export function LoginFooter() {
  const { t } = useTranslation();
  return (
    <p className="text-center text-sm text-gray-600 mt-8">
      {t("auth.login.footer")}
    </p>
  );
}
