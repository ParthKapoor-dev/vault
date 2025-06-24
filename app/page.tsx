import * as FadeIn from "@/components/motion/staggers/fade";
import PageLayout from "@/components/PageLayout";
import { OpenGraph } from "@/lib/og";
import { Items } from "@/types/items";

import { time } from "console";

import React from "react";

// export function generateMetadata() {
//   const image = `${process.env.NEXT_PUBLIC_SITE_URL}api/og?title=${encodeURIComponent(category)}`;

//   return {
//     ...OpenGraph,
//     category,
//     openGraph: {
//       category,
//       images: [image],
//     },
//     twitter: {
//       images: [image],
//     },
//   };
// }

export default function Page() {
  const items: Items = [
    {
      type: "Directory",
      slug: "resumes",
      title: "Resumes",
      createdAt: Date.now(),
    },
    {
      type: "Directory",
      slug: "config",
      title: "Config Files",
      createdAt: Date.now(),
    },
    {
      type: "Directory",
      slug: "about",
      title: "About Me",
      createdAt: Date.now(),
    },
  ];

  const Spacer = () => <div style={{ marginTop: "24px" }} />;

  return (
    <React.Fragment>
      <FadeIn.Item>
        <div className="flex justify-between">
          <div>
            <h1>lnx.parthkapoor.me</h1>
            <h2>Vault</h2>
          </div>
        </div>
      </FadeIn.Item>
      <Spacer />
      <FadeIn.Item>
        <PageLayout items={items} path="" />
      </FadeIn.Item>
    </React.Fragment>
  );
}
