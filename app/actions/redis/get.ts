import type { Items } from "@/types/items";

import redis from "@/lib/redis";

export default async function getPageItems(url: string): Promise<Items | undefined> {
  try {
    const data = (await redis.get(url)) as Items;
    return data;
  } catch (err) {
    console.log("Error", err);
  }
}
