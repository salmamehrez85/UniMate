import { GraduationCap } from "lucide-react";

export function Logo({ size = "md", showText = true }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const textSize = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center text-white font-bold shadow-md`}>
        <GraduationCap className="w-6 h-6" />
      </div>

      {showText && (
        <div>
          <h1 className={`${textSize[size]} font-bold text-primary-700`}>
            UniMate
          </h1>
          <p className="text-xs text-primary-600 font-medium">Academic AI</p>
        </div>
      )}
    </div>
  );
}
