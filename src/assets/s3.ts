import { S3Client } from "@aws-sdk/client-s3";
import { decrypt } from "./crypto";

const accessKeyId = "c09c63ca3621ca120f93214548025052";
const encryptedSecretAccessKey =
  "G5uJf6KFvpHdxOg9I2WRUwSEJgCNJBwsk29owYLDlWypJ/I9Tk7ag7ho0qb+NJmgX9NQHowHwqOnOhYSMu44wexiiuBnB3QLxvBcVm6n0fhJtVVHNRNPrAxZxnAbgDU/ZND7i4Tz05RVb5HQ";
export const bucketName = "Nishsite";


interface AWSCreds {
  accessKeyId: string;
  secretAccessKey: string;
}

export async function getDecryptedCredentials(
  password: string,
): Promise<AWSCreds> {
  const secretAccessKey = await decrypt(
    encryptedSecretAccessKey,
    password,
  );
  return { accessKeyId, secretAccessKey };
}

export function getS3Client(creds: AWSCreds): S3Client {
  return new S3Client({
    region: "ap-south-1", // Supabase region doesn't matter, just keep "auto"
    endpoint:
      "https://mayhiqsvljlyvismbpio.storage.supabase.co/storage/v1/s3",
    credentials: {
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
    }
  });
}
