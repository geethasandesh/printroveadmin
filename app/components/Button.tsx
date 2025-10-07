import { ReactNode } from "react";

interface ButtonProps {
  children?: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "icon";
  size?: "sm" | "md" | "lg";
  className?: string;
  type?: "button" | "submit" | "reset";
  icon?: ReactNode;
}

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  icon,
}: ButtonProps) {
  const baseStyles = "font-semibold transition-colors rounded-lg";

  const variantStyles = {
    primary: "bg-[#272727] text-white hover:bg-[#1a1a1a]",
    secondary: "bg-white text-black border border-[#EBEBEB] hover:bg-[#f5f5f5]",
    icon: "bg-white text-black border border-[#E3E3E3] hover:bg-[#f5f5f5] w-8 h-8 p-0 flex items-center justify-center",
  };

  const sizeStyles = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-[6px] text-[13px]",
    lg: "px-4 py-2 text-sm",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${
        variant !== "icon" ? sizeStyles[size] : ""
      } ${className}`}
    >
      {variant === "icon" ? icon : children}
    </button>
  );
}
