"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type"> & {
  containerClassName?: string;
};

export function PasswordInput({
  className,
  containerClassName,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn("relative", containerClassName)}>
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(
          "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20",
          className,
        )}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 transition-colors"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
