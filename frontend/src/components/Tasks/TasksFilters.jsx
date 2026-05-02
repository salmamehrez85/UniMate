import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

export function TasksFilters({
  statusOptions,
  statusFilter,
  onStatusChange,
  priorityOptions,
  priorityFilter,
  onPriorityChange,
  query,
  onQueryChange,
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onStatusChange(option.value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              statusFilter === option.value
                ? "bg-teal-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}>
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t("tasks.filters.searchPlaceholder")}
            className="w-full sm:w-64 ps-10 pe-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={priorityFilter}
          onChange={(event) => onPriorityChange(event.target.value)}
          className="w-full sm:w-48 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
          {priorityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
