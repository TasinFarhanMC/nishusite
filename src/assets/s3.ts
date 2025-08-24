import { S3Client } from "@aws-sdk/client-s3";
import type { AwsCredentialIdentity } from "@aws-sdk/types";

import { decrypt } from "./crypto";
import { getUrl, endpoint } from "./file";

export const bucketName = "Nishsite";

interface EncriptedS3Creds {
  accessKeyId: string;
  encryptedSecretAccessKey: string;
};

export async function getS3Client(password: string): Promise<S3Client> {
  const storedCreds = localStorage.getItem("s3Creds");

  if (storedCreds) {
    return new S3Client({
      region: "ap-south-1",
      endpoint: `${endpoint}/s3`,
      credentials: JSON.parse(storedCreds),
    });
  }

  const res = await fetch(getUrl("s3.json"), { cache: "reload" });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  const encriptedCreds: EncriptedS3Creds = await res.json();

  const secretAccessKey = await decrypt(
    encriptedCreds.encryptedSecretAccessKey,
    password,
  );

  const s3Creds: AwsCredentialIdentity = {
    accessKeyId: encriptedCreds.accessKeyId,
    secretAccessKey: secretAccessKey,
  };

  if (JSON.parse(localStorage.getItem("storeCreds") ?? "false")) {
    localStorage.setItem("s3Creds", JSON.stringify(s3Creds));
  }

  return new S3Client({
    region: "ap-south-1",
    endpoint: `${endpoint}/s3`,
    credentials: s3Creds
  });
}
