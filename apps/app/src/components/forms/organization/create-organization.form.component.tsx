import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightIcon, SpinnerIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { nanoid } from "nanoid";
import { Controller, useForm } from "react-hook-form";
import slugify from "slugify";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import * as FieldComponent from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  type IzOrganizationFormCreate,
  zOrganizationFormCreate,
} from "~/forms/organizations.form";
import { organizationHttp } from "~/lib/http/organization.http";

export default function CreateOrganizationForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm<IzOrganizationFormCreate>({
    resolver: zodResolver(zOrganizationFormCreate),
    defaultValues: {
      name: "",
    },
    mode: "onChange",
  });

  function generateOrganizationSlug(name: string) {
    return `${slugify(name, { lower: true, strict: true, trim: true })}-${nanoid(12)}`;
  }

  async function handleSubmit(data: IzOrganizationFormCreate) {
    try {
      await organizationHttp.createOrganization({
        name: data.name,
        slug: generateOrganizationSlug(data.name),
      });
      await queryClient.invalidateQueries({
        queryKey: ["user", "session"],
      });
      await navigate({ to: "/organizations" });
    } catch (error) {
      toast.error("Failed to create organization", {
        description:
          error instanceof Error ? error.message : "An error occurred",
        richColors: true,
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
      <FieldComponent.FieldGroup>
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <FieldComponent.Field data-invalid={fieldState.invalid}>
              <FieldComponent.FieldLabel htmlFor="organization-create">
                Organization Name
              </FieldComponent.FieldLabel>
              <Input
                {...field}
                id="organization-create-name"
                aria-invalid={fieldState.invalid}
                placeholder="Turing Co."
                autoComplete="off"
              />
              {fieldState.invalid && (
                <FieldComponent.FieldError errors={[fieldState.error]} />
              )}
            </FieldComponent.Field>
          )}
        />
      </FieldComponent.FieldGroup>

      <div className="w-full space-y-2">
        <Button disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? (
            <SpinnerIcon className="animate-spin" />
          ) : (
            <span className="flex items-center gap-1.5">
              <p>Continue</p>
              <ArrowRightIcon weight="bold" />
            </span>
          )}
        </Button>
        <div className="flex justify-center">
          <Button
            variant="link"
            type="button"
            disabled={form.formState.isSubmitting}
            className="mt-1 w-fit px-0 py-0 text-center text-muted-foreground text-xs"
          >
            <Link to="/organizations">Go back to organizations</Link>
          </Button>
        </div>
      </div>
    </form>
  );
}
