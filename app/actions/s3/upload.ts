import { s3Client } from "@/lib/s3";

import { PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";

export default async function uploadObject(Key: string) {
  const params: PutObjectCommandInput = {
    Bucket: process.env.SPACES_BUCKET!,
    Key,
    Body: "Hello, World!",
    ACL: "private",
    Metadata: {
      "x-amz-meta-my-key": "your-value",
    },
  };

  try {
    const data = await s3Client.send(new PutObjectCommand(params));
    console.log(
      "Successfully uploaded object: " + params.Bucket + "/" + params.Key,
    );
    return data;
  } catch (err) {
    console.log("Error", err);
  }
}
