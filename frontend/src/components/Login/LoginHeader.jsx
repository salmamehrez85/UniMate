import { Logo } from "../Logo";
import { useTranslation } from "react-i18next";

export function LoginHeader() {
  const { t } = useTranslation();
  return (
    <div className="text-center mb-8">
      <div className="flex justify-center mb-4">
        <Logo size="large" />
      </div>
      <h1
        className="text-3xl font-extrabold mb-2 tracking-tight"
        style={{
          background:
            "linear-gradient(135deg,#4f46e5 0%,#7c3aed 40%,#a855f7 70%,#3b82f6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {t("auth.login.title")}
      </h1>
      <p className="text-gray-500 text-sm">{t("auth.login.subtitle")}</p>
    </div>
  );
}
