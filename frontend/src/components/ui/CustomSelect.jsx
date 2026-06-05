import { useState, useRef, useEffect, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import {
  dropdownItemClass,
  dropdownItemSelectedClass,
  dropdownTriggerBaseClass,
} from "./dropdownStyles";

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
  const [menuRect, setMenuRect] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const instanceId = useId();

  const selectedOption = options.find((opt) => opt.value === value);
  const selectedLabel = selectedOption?.label || placeholder;

  const defaultColorClass = (val) => {
    const index = options.findIndex((opt) => opt.value === val);
    const colors = [
      "bg-blue-50/80 border-blue-200 hover:bg-blue-100/80",
      "bg-orange-50/80 border-orange-200 hover:bg-orange-100/80",
      "bg-green-50/80 border-green-200 hover:bg-green-100/80",
      "bg-red-50/80 border-red-200 hover:bg-red-100/80",
      "bg-purple-50/80 border-purple-200 hover:bg-purple-100/80",
      "bg-pink-50/80 border-pink-200 hover:bg-pink-100/80",
    ];
    return colors[index % colors.length];
  };

  const resolveColorClass = getColorClass || defaultColorClass;

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setMenuRect({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  const openDropdown = () => {
    const trigger = triggerRef.current;
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      setMenuRect({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event) => {
      const target = event.target;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleReposition = () => updateMenuPosition();

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isOpen, updateMenuPosition]);

  const triggerStateClass = isOpen
    ? "border-teal-500 bg-white ring-2 ring-teal-500/20"
    : resolveColorClass(value) ||
      "border-slate-300 bg-white hover:bg-slate-50";

  const menuId = `custom-select-menu-${name || instanceId}`;

  const menuContent =
    isOpen && !disabled && menuRect ? (
      <ul
        ref={menuRef}
        id={menuId}
        role="listbox"
        aria-label={label || placeholder}
        style={{
          position: "fixed",
          top: menuRect.top,
          left: menuRect.left,
          width: menuRect.width,
          zIndex: 9999,
        }}
        className="p-2 bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-y-auto space-y-0.5">
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <li key={option.value} role="none">
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(option.value)}
                className={`${dropdownItemClass} ${
                  isSelected ? dropdownItemSelectedClass : ""
                }`}>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{option.label}</p>
                  {getDescription && (
                    <p className="text-xs text-slate-500 mt-0.5 font-normal">
                      {getDescription(option.value)}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <span
                    className="w-2 h-2 rounded-full bg-gradient-to-br from-indigo-600/60 via-purple-500/60 to-blue-500/60 shrink-0"
                    aria-hidden="true"
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    ) : null;

  return (
    <div ref={rootRef} className="flex flex-col gap-2">
      {label && (
        <span className="text-sm font-medium text-slate-700">{label}</span>
      )}

      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => {
            if (disabled) return;
            if (isOpen) setIsOpen(false);
            else openDropdown();
          }}
          className={`${dropdownTriggerBaseClass} ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          } ${triggerStateClass} ${buttonClassName}`}>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">
              {selectedLabel}
            </p>
            {getDescription && value && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {getDescription(value)}
              </p>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>
      </div>

      {menuContent && createPortal(menuContent, document.body)}
    </div>
  );
}
