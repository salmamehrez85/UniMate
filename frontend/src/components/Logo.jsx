import logoImage from "../assets/logo.png";

export function Logo({ size = "md", showText = true }) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  return (
    <div className="flex items-center gap-2">
      <img
        src={logoImage}
        alt="UniMate Logo"
        className={`${sizeClasses[size]} object-contain`}
      />
    </div>
  );
}
