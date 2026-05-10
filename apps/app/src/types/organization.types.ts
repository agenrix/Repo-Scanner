export interface IOrganization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  metadata: Record<string, string>;
  createdAt: Date;
}
