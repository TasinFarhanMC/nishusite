// s3.ts
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { AwsCredentialIdentity } from "@aws-sdk/types"
import { endpoint, getUrl } from "./file";
import { decrypt } from "./crypto";

export const bucketName = "Nishsite";

interface EncriptedS3Creds {
  accessKeyId: string;
  encryptedSecretAccessKey: string;
};

export async function createS3creds(password: string) {
  const res = await fetch(getUrl("s3.json"), { cache: "reload" });
  if (!res.ok) throw new Error(`Unable to get s3.json: ${await res.text()}`);

  const encriptedCreds: EncriptedS3Creds = await res.json();
  const secretAccessKey = await decrypt(
    encriptedCreds.encryptedSecretAccessKey,
    password,
  );

  const s3Creds: AwsCredentialIdentity = {
    accessKeyId: encriptedCreds.accessKeyId,
    secretAccessKey: secretAccessKey,
  };

  return s3Creds;
}

export async function getS3Client(): Promise<S3Client> {
  let s3Creds = JSON.parse(sessionStorage.getItem("s3Creds") ?? "null");

  if (!s3Creds) {
    const password = localStorage.getItem("password");
    if (!password) {
      throw new Error("No Password Stored");
    }

    s3Creds = await createS3creds(password);
    localStorage.sessionStorage("s3Creds", JSON.stringify(s3Creds));
  }

  return new S3Client({
    region: "ap-south-1",
    endpoint: `${endpoint}/s3`,
    credentials: s3Creds
  });
}

export async function uploadBinary(client: S3Client, path: string, data: Uint8Array) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: path,
    Body: data,
  });

  return client.send(command);
}

export async function uploadNumber(client: S3Client, path: string, num: number | bigint) {
  const bigNum = BigInt(num);
  const buffer = new ArrayBuffer(8); new DataView(buffer).setBigUint64(0, bigNum, false); // big-endian
  return uploadBinary(client, path, new Uint8Array(buffer));
}
