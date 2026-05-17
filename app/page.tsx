import * as FadeIn from "@/components/motion/staggers/fade";
import PageTemplate from "@/components/PageTemplate";
import React from "react";
import { listObjectsV2 } from "@/actions/s3/list";
import { notFound } from "next/navigation";

// Listings depend on the visitor's session (admin sees private items).
export const dynamic = "force-dynamic";

export default async function Page() {
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
        <PageTemplate items={items} path="" />
      </FadeIn.Item>
    </React.Fragment>
  );
}
