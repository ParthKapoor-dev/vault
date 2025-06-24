import redis from "@/lib/redis";
import { Items } from "@/types/items";

import {
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";

export default async function getPageItems(
  url: string,
): Promise<Items | undefined> {
  try {
    const data = (await redis.get(url)) as Items;
    return data;
  } catch (err) {
    console.log("Error", err);
  }
}
