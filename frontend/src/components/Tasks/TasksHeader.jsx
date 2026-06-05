import { ListTodo, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

export function TasksHeader({ onAddTask }) {
  const { t } = useTranslation();
  return (
    <div className="page-hero">
      {/* Blobs */}
      <div className="page-hero-blob page-hero-blob-1" />
      <div className="page-hero-blob page-hero-blob-2" />
      <div className="page-hero-blob page-hero-blob-3" />

      <div className="page-hero-content flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="page-hero-label">
            <span className="page-hero-label-dot" />
            <ListTodo style={{ width: "0.85rem", height: "0.85rem" }} />
            {t("tasks.header.label")}
          </div>
          <h1 className="page-hero-title">{t("tasks.header.title")}</h1>
          <p className="page-hero-subtitle">{t("tasks.header.subtitle")}</p>
        </div>

        <button onClick={onAddTask} className="btn-hero self-start shrink-0">
          <Plus style={{ width: "1rem", height: "1rem" }} />
          {t("tasks.header.addTask")}
        </button>
      </div>
    </div>
  );
}
