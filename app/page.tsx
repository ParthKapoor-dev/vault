// page.tsx
import type { Items } from "@/types/items";
import * as FadeIn from "@/components/motion/staggers/fade";
import PageTemplate from "@/components/PageTemplate";
import { getSession } from "@/lib/auth/client";
import React from "react";

export default async function Page() {
  const { data } = await getSession();
  // const isAdmin = data?.user?.isAdmin!;
  const isAdmin = true;

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
          {isAdmin && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground bg-emerald-500 px-2 py-1 rounded">
                Admin Mode
              </span>
            </div>
          )}
        </div>
      </FadeIn.Item>
      <Spacer />
      <FadeIn.Item>
        <PageTemplate items={items} path="" isAdmin={isAdmin == true} />
      </FadeIn.Item>
    </React.Fragment>
  );
}
