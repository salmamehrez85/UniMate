import logoLight from "../assets/logo.png";
import logoDark from "../assets/Logo_dark_mode.png";
import { useEffect, useState } from "react";

function getCurrentTheme() {
  return document.documentElement.getAttribute("data-theme") || "light";
}

export function Logo({ size = "md", showText = true }) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const [theme, setTheme] = useState(getCurrentTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(getCurrentTheme());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex items-center gap-2">
      <img
        src={theme === "dark" ? logoDark : logoLight}
        alt="UniMate Logo"
        className={`${sizeClasses[size]} object-contain`}
      />
    </div>
  );
}
