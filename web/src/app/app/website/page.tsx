import type { Metadata } from "next";
import { requireAgent } from "@/lib/auth";
import { getSite } from "@/lib/sites";
import { Card, PageHeader } from "@/components/ui";
import { Editor } from "./editor";

export const metadata: Metadata = { title: "Website" };

export default async function WebsitePage({ searchParams }: PageProps<"/app/website">) {
  const agent = await requireAgent();
  const { welcome } = await searchParams;
  const site = getSite(agent.id);

  return (
    <>
      {welcome && (
        <Card className="mb-6 p-5">
          <p className="font-semibold text-ink">Your website is live.</p>
          <p className="mt-0.5 text-sm text-muted">Add your phone number and a short bio, then share your link.</p>
        </Card>
      )}
      <PageHeader title="Website" sub={<>Your site lives at <span className="text-ink">/s/{agent.slug}</span>.</>} />
      <Editor site={site} slug={agent.slug} />
    </>
  );
}
