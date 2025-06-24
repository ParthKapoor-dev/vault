import type { GetObjectCommandInput } from "@aws-sdk/client-s3";

import { s3Client } from "@/lib/s3";

export default async function getObject(Key: string) {
  const params: GetObjectCommandInput = {
    Bucket: process.env.SPACES_BUCKET || "",
    Key,
  };

  try {
    const data = await s3Client.getObject(params);
    console.log(`Successfully uploaded object: ${params.Bucket}/${params.Key}`);
    return data;
  } catch (err) {
    console.log("Error", err);
  }
}
