import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightIcon, SpinnerIcon } from "@phosphor-icons/react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import * as FieldComponent from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { organizationHttp } from "~/lib/http/organization.http";

const zInviteTeammateForm = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type IzInviteTeammateForm = z.infer<typeof zInviteTeammateForm>;

export default function InviteTeammateForm({
  organizationId,
  onSuccess,
}: {
  organizationId: string;
  onSuccess?: () => void;
}) {
  const form = useForm<IzInviteTeammateForm>({
    resolver: zodResolver(zInviteTeammateForm),
    defaultValues: {
      email: "",
    },
    mode: "onChange",
  });

  async function handleSubmit(data: IzInviteTeammateForm) {
    try {
      await organizationHttp.inviteTeammate(organizationId, {
        email: data.email,
        role: "member",
      });
      toast.success("Invitation sent!", {
        description: `An invitation has been sent to ${data.email}.`,
        richColors: true,
      });
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to send invitation", {
        description:
          error instanceof Error ? error.message : "An error occurred",
        richColors: true,
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <FieldComponent.FieldGroup>
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FieldComponent.Field data-invalid={fieldState.invalid}>
              <FieldComponent.FieldLabel htmlFor="invite-email">
                Email Address
              </FieldComponent.FieldLabel>
              <Input
                {...field}
                id="invite-email"
                type="email"
                aria-invalid={fieldState.invalid}
                placeholder="colleague@example.com"
                autoComplete="off"
              />
              {fieldState.invalid && (
                <FieldComponent.FieldError errors={[fieldState.error]} />
              )}
            </FieldComponent.Field>
          )}
        />
      </FieldComponent.FieldGroup>

      <div className="w-full">
        <Button disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? (
            <SpinnerIcon className="animate-spin" />
          ) : (
            <span className="flex items-center gap-1.5">
              <p>Send Invitation</p>
              <ArrowRightIcon weight="bold" />
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
