import { SpinnerIcon } from "@phosphor-icons/react";
import { cn } from "~/lib/utils";
import { Button, type ButtonProps } from "../ui/button";

export function SubmitButton({
  children,
  isSubmitting,
  disabled,
  ...props
}: {
  children: React.ReactNode;
  isSubmitting: boolean;
  disabled?: boolean;
} & ButtonProps) {
  return (
    <Button
      disabled={isSubmitting || disabled}
      {...props}
      className={cn("relative", props.className)}
    >
      <span className={cn(isSubmitting && "invisible")}>{children}</span>
      {isSubmitting && (
        <div className="absolute inset-0 flex items-center justify-center">
          <SpinnerIcon className="animate-spin" />
        </div>
      )}
    </Button>
  );
}
