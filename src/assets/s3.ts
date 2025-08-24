// s3.ts
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { AwsCredentialIdentity } from "@aws-sdk/types"
import { endpoint, getUrl } from "./file";
import { panel_to_array, type Panel } from "./panels";
import { encode } from "@msgpack/msgpack";
import { decrypt } from "./crypto";

export const bucketName = "Nishsite";

interface EncriptedS3Creds {
  accessKeyId: string;
  encryptedSecretAccessKey: string;
};

export function isLoggedIn() {
  return sessionStorage.getItem("s3Creds") != null;
}

export async function createS3ClientFromPass(password: string): Promise<S3Client> {
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

  localStorage.sessionStorage("s3Creds", JSON.stringify(s3Creds));

  return new S3Client({
    region: "ap-south-1",
    endpoint: `${endpoint}/s3`,
    credentials: s3Creds
  });
}

export function getS3Client(): S3Client {
  return new S3Client({
    region: "ap-south-1",
    endpoint: `${endpoint}/s3`,
    credentials: JSON.parse(sessionStorage.getItem("s3Creds") as string)
  });
}

export async function uploadPanels(client: S3Client, panels: Record<number, Panel>) {
  // Convert Record<number, Panel> -> [key, array][]
  const panelsArray: [number, (number | string)[]][] = Object.entries(panels).map(
    ([key, panel]) => [Number(key), panel_to_array(panel)]
  );

  // Encode to MessagePack
  const packed = encode(panelsArray);

  // Upload as panels.msgpack
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: "panels.msgpack",
    Body: packed,
  });

  const result = await client.send(command);
  return result;
}

export async function uploadNumber(client: S3Client, num: number | bigint, path: string) {
  const bigNum = typeof num === "number" ? BigInt(num) : num;

  const buffer = new ArrayBuffer(8);
  new DataView(buffer).setBigUint64(0, bigNum, false); // big-endian

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: path,
    Body: new Uint8Array(buffer),
    ContentType: "application/octet-stream",
    CacheControl: "no-cache",
  });

  return client.send(command);
}
