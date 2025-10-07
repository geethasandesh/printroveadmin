import AWS from "aws-sdk";

const s3 = new AWS.S3({
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
  region: process.env.NEXT_PUBLIC_AWS_REGION,
});

export interface UploadedImage {
  key: string;
  url: string; // Original S3 URL for backend
  signedUrl?: string; // Signed URL for preview
  _id: string;
}

export const uploadToS3 = async (
  file: File,
  type: "thumbnail" | "mockup" | "variant" | "gridline"
): Promise<UploadedImage> => {
  if (!file) {
    throw new Error("No file provided");
  }

  try {
    const fileName = `${Date.now()}-${file.name.replace(
      /[^a-zA-Z0-9.-]/g,
      ""
    )}`;
    const key = `temp/${type}s/${fileName}`;

    const params = {
      Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME!,
      Key: key,
      Body: file,
      ContentType: file.type,
    };

    if (!params.Bucket) {
      throw new Error("S3 bucket name is not configured");
    }

    const uploadResult = await s3.upload(params).promise();

    if (!uploadResult.Location) {
      throw new Error("Upload successful but URL not received");
    }

    // Generate signed URL for preview
    const signedUrl = await s3.getSignedUrlPromise("getObject", {
      Bucket: params.Bucket,
      Key: uploadResult.Key,
      Expires: 900, // 15 minutes
    });

    return {
      key: uploadResult.Key,
      url: uploadResult.Location, // Original S3 URL
      signedUrl, // Signed URL for preview
      _id: uploadResult.Key.split("/").pop() || "",
    };
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw new Error(
      error instanceof Error
        ? `S3 Upload failed: ${error.message}`
        : "S3 Upload failed with unknown error"
    );
  }
};

export const getSignedUrlFromImageUrl = async (
  imageUrl: string
): Promise<string> => {
  try {
    const bucket = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME!;
    if (!bucket) {
      throw new Error("S3 bucket name is not configured");
    }

    // Extract the key from the image URL
    const url = new URL(imageUrl);
    // Remove leading slash if present
    let key = url.pathname.startsWith("/")
      ? url.pathname.slice(1)
      : url.pathname;

    // If the bucket is in the path-style URL, remove the bucket name from the key
    if (key.startsWith(`${bucket}/`)) {
      key = key.slice(bucket.length + 1);
    }

    const signedUrl = await s3.getSignedUrlPromise("getObject", {
      Bucket: bucket,
      Key: key,
      Expires: 900, // 15 minutes
    });

    return signedUrl;
  } catch (error) {
    console.error("Get Signed URL Error:", error);
    throw new Error(
      error instanceof Error
        ? `Get Signed URL failed: ${error.message}`
        : "Get Signed URL failed with unknown error"
    );
  }
};
