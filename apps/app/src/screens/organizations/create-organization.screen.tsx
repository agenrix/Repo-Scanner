import CreateOrganizationForm from "~/components/forms/organization/create-organization.form.component";

export default function CreateOrganizationScreen() {
  return (
    <div className="relative z-20 m-auto flex w-full max-w-120 flex-col">
      <div className="text-center">
        <h1 className="mb-2 font-heading text-lg lg:text-xl">
          Create an organization
        </h1>
        <p className="mb-8 text-muted-foreground text-sm">
          Give your workspace a name to get started.
        </p>
      </div>

      <div className="w-full">
        <CreateOrganizationForm />
      </div>
    </div>
  );
}
