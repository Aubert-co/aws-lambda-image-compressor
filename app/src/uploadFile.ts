import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getErrorMessage } from "./utils";

type UploadFile = {
  fileBuffer: Buffer;
  urlPath: string;
  mimeType: string;
};

type UploadImageResult = {
  success: boolean;
  error?: string;
};

type GetFile = {
  urlPath: string;
};

type GetFileResult =
  | {
      success: true;
      fileBuffer: Buffer;
      mimeType?: string;
    }
  | {
      success: false;
      error: string;
    };

type DeleteFile = {
  urlPath: string;
};

type DeleteFileResult = {
  success: boolean;
  error?: string;
};

export class AwsStorage {
  private client: S3Client;
  private bucket: string;
  private region: string;

  constructor() {
    const AWS_REGION = "sa-east-1";
    const AWS_BUCKET ="cdn.aubertbarbosa.com";
  

    if (!AWS_REGION) {
      throw new Error("AWS_REGION not defined");
    }

    if (!AWS_BUCKET) {
      throw new Error("AWS_BUCKET not defined");
    }

    

    this.region = AWS_REGION;
    this.bucket = AWS_BUCKET;

    this.client = new S3Client({
      region: this.region,
    });
  }

  async upload({
    fileBuffer,
    urlPath,
    mimeType,
  }: UploadFile): Promise<UploadImageResult> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: urlPath,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      await this.client.send(command);

      return {
        success: true,
      };
    } catch (err:unknown) {
      return {
        success: false,
        error: getErrorMessage(err),
      };
    }
  }

  async get({ urlPath }: GetFile): Promise<GetFileResult> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: urlPath,
      });

      const response = await this.client.send(command);

      if (!response.Body) {
        return {
          success: false,
          error: "file-not-found",
        };
      }

      const byteArray = await response.Body.transformToByteArray();
      const fileBuffer = Buffer.from(byteArray);

      return {
        success: true,
        fileBuffer,
        mimeType: response.ContentType,
      };
    } catch (err:unknown) {
      return {
        success: false,
        error: getErrorMessage(err),
      };
    }
  }

  async delete({ urlPath }: DeleteFile): Promise<DeleteFileResult> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: urlPath,
      });

      await this.client.send(command);

      return {
        success: true,
      };
    } catch (err:unknown) {
      return {
        success: false,
        error:getErrorMessage(err),
      };
    }
  }
}