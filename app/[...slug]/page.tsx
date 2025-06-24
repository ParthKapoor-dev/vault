import PageLayout from "@/components/PageLayout";
import { OpenGraph } from "@/lib/og";

import { notFound } from "next/navigation";

import getPageItems from "../actions/redis/get";

export interface PageProps {
  params: { slug?: string[] };
}

/**
 * Dynamically generate meta tags based on the current vault item
 */
// export async function generateMetadata({ params }: PageProps) {
//   const slugArray = params.slug || [];
//   const [category, itemSlug] = slugArray;

//   if (!category) {
//     return { title: OpenGraph.title };
//   }

//   const items = await getVaultItems(category);
//   const item = items.find((p) => p.slug === itemSlug);
//   if (!item) {
//     return { title: OpenGraph.title };
//   }

//   const title = item.title;
//   const image = `${process.env.NEXT_PUBLIC_SITE_URL}api/og?title=${encodeURIComponent(
//     title,
//   )}`;

//   return {
//     ...OpenGraph,
//     title,
//     openGraph: { title, images: [image] },
//     twitter: { images: [image] },
//   };
// }

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

  return <PageLayout items={items} path={pathName} />;
}
