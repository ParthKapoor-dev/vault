// page.tsx
import type { Items } from "@/types/items";
import * as FadeIn from "@/components/motion/staggers/fade";
import PageTemplate from "@/components/PageTemplate";
import React from "react";
import { getSession } from "@/lib/auth";
import { headers } from "next/headers";
import { listObjectsV2 } from "@/actions/s3/list";
import { notFound } from "next/navigation";

export default async function Page() {
  const data = await getSession(headers());
  const isAdmin = data?.user?.isAdmin;
  const Spacer = () => <div style={{ marginTop: "24px" }} />;

  const items = await listObjectsV2("");
  if (!items) {
    return notFound();
  }

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
        <PageTemplate items={items} path="" isAdmin={isAdmin == true} />
      </FadeIn.Item>
    </React.Fragment>
  );
}

const mockItems: Items = [
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
