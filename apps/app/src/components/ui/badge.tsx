import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "~/lib/utils";

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & {
  variant?: "default" | "outline" | "destructive";
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap border px-1.5 py-0.5 font-medium text-[11px] leading-none",
        variant === "default" &&
          "border-transparent bg-primary text-primary-foreground",
        variant === "outline" && "border-border bg-background text-foreground",
        variant === "destructive" &&
          "border-destructive/20 bg-destructive/10 text-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
