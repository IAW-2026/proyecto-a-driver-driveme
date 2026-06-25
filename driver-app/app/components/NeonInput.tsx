import { InputHTMLAttributes } from "react";

export default function NeonInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full md:w-auto rounded-sharp bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-[#6B7280] focus:border-primary focus:shadow-[0_0_0_1px_#DC2626,0_0_15px_rgba(220,38,38,0.2)] transition-all duration-150 ${className}`}
    />
  );
}
