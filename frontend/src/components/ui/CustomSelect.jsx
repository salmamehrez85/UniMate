import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function CustomSelect({
  value,
  onChange,
  options = [],
  disabled = false,
  placeholder = "Select an option",
  getDescription = null,
  getColorClass = null,
  name = "",
  label = null,
  buttonClassName = "",
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);
  const selectedLabel = selectedOption?.label || placeholder;

  const defaultColorClass = (val) => {
    const index = options.findIndex((opt) => opt.value === val);
    const colors = [
      "bg-blue-50 border-blue-200 hover:bg-blue-100",
      "bg-orange-50 border-orange-200 hover:bg-orange-100",
      "bg-green-50 border-green-200 hover:bg-green-100",
      "bg-red-50 border-red-200 hover:bg-red-100",
      "bg-purple-50 border-purple-200 hover:bg-purple-100",
      "bg-pink-50 border-pink-200 hover:bg-pink-100",
    ];
    return colors[index % colors.length];
  };

  const resolveColorClass = getColorClass || defaultColorClass;

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  return (
    <>
      {/* Backdrop - captures outside clicks, only renders when open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Parent wrapper - elevated z-index when dropdown is open */}
      <div className={`flex flex-col gap-2 ${isOpen ? "z-50 relative" : ""}`}>
        {label && (
          <span className="text-sm font-medium text-gray-700">{label}</span>
        )}

        {/* Relative container for absolute dropdown positioning */}
        <div className="relative">
          <button
            onClick={() => !disabled && setIsOpen(!isOpen)}
            type="button"
            disabled={disabled}
            className={`w-full px-4 py-2.5 border-2 rounded-lg font-medium transition-all flex items-center justify-between ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            } ${
              isOpen
                ? `border-teal-500 ${resolveColorClass(value).split(" ")[0]} ${
                    resolveColorClass(value).split(" ")[2]
                  }`
                : `border-gray-300 ${resolveColorClass(value)}`
            } ${buttonClassName}`}>
            <div className="text-left">
              <p className="font-semibold text-gray-900">{selectedLabel}</p>
              {getDescription && value && (
                <p className="text-xs text-gray-600">{getDescription(value)}</p>
              )}
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-600 transition-transform flex-shrink-0 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu - absolutely positioned with strict max-height scrolling */}
          {isOpen && !disabled && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-50">
              <div className="max-h-60 overflow-y-auto">
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    type="button"
                    className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-b last:border-b-0 text-left ${
                      value === option.value ? "bg-teal-50" : ""
                    }`}>
                    <div>
                      <p className="font-medium text-gray-900">
                        {option.label}
                      </p>
                      {getDescription && (
                        <p className="text-xs text-gray-600">
                          {getDescription(option.value)}
                        </p>
                      )}
                    </div>
                    {value === option.value && (
                      <div className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
