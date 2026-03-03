import { Client } from "minio"

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin"
})

const BUCKET_NAME = "skyintern"

export const initializeBucket = async () => {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME)
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, "us-east-1")
      console.log(`✅ MinIO bucket "${BUCKET_NAME}" created successfully`)
    } else {
      console.log(`✅ MinIO connected - bucket "${BUCKET_NAME}" ready`)
    }
  } catch (error: any) {
    if (error.code === "ECONNREFUSED") {
      console.warn(`⚠️  MinIO not running - File upload features will be disabled`)
      console.warn(`   To enable file uploads, start MinIO server on port ${process.env.MINIO_PORT || 9000}`)
    } else {
      console.error("❌ MinIO error:", error.message)
    }
  }
}

export const uploadFile = async (
  fileName: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string> => {
  try {
    await minioClient.putObject(BUCKET_NAME, fileName, fileBuffer, fileBuffer.length, {
      "Content-Type": contentType
    })

    return `${process.env.MINIO_URL || "http://localhost:9000"}/${BUCKET_NAME}/${fileName}`
  } catch (error: any) {
    if (error.code === "ECONNREFUSED") {
      throw new Error("MinIO server not running. File upload is disabled.")
    }
    throw error
  }
}

export const getFileUrl = (fileName: string): string => {
  return `${process.env.MINIO_URL || "http://localhost:9000"}/${BUCKET_NAME}/${fileName}`
}

export const deleteFile = async (fileName: string): Promise<void> => {
  try {
    await minioClient.removeObject(BUCKET_NAME, fileName)
  } catch (error: any) {
    if (error.code === "ECONNREFUSED") {
      console.warn("MinIO not available - skipping file deletion")
      return
    }
    throw error
  }
}
