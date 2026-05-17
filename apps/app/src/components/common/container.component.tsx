import type React from "react";
import { cn } from "~/lib/utils";

interface ContainerProps {
  children: Readonly<React.ReactNode>;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn("mx-auto max-w-7xl px-6 py-10", className)}>
      {children}
    </div>
  );
}
