import { formatter } from "@/lib/formatter";
import { Items } from "@/types/items";

import { Link as NextViewTransition } from "next-view-transitions";
import React from "react";

interface PageProps {
  items: Items;
  path: string;
}

const PageLayout = ({ items, path }: PageProps) => {
  items = items.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const Seperator = () => <div className="border-border border-t" />;

  if (items.length === 0) {
    return null;
  }

  return (
    <div className=" flex flex-col">
      <NextViewTransition href={`/${path}`} className="flex justify-between">
        <h2 className="py-2 text-muted capitalize">
          {path.split("/")[-1]} {items.length > 0 && `(${items.length})`}
        </h2>
      </NextViewTransition>

      {items.map((item) => {
        return (
          <React.Fragment key={item.slug}>
            <Seperator />
            <NextViewTransition
              href={getSlug(path, item.slug)}
              className="flex w-full justify-between py-2"
            >
              <p>{item.title}</p>
              <p className="mt-0 text-muted">
                {formatter.date(new Date(item.createdAt))}
              </p>
            </NextViewTransition>
          </React.Fragment>
        );
      })}
    </div>
  );
};

function getSlug(path: string, slug: string) {
  if (path == "") return `/${slug}`;
  return `/${path}/${slug}`;
}

export default PageLayout;
