import PageLayout from "@/components/PageTemplate";

import { notFound } from "next/navigation";

import getPageItems from "@/actions/redis/get";

export interface PageProps {
  params: { slug?: string[] };
}

/**
 * Single entry point for both category index and individual vault items
 */
export default async function Page({ params }: PageProps) {
  const slugArray = params.slug || [];
  const pathName = slugArray.join("/");

  const items = await getPageItems(pathName);
  if (!items) {
    return notFound();
  }

  return <PageLayout items={items} path={pathName} isAdmin={false} />;
}
