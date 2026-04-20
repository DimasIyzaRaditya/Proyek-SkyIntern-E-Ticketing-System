// Utilitas penyimpanan file menggunakan MinIO (S3-compatible object storage).
// Menginisialisasi bucket "skyintern" saat server start, serta menyediakan
// fungsi uploadFile, getFileUrl, dan deleteFile untuk mengelola file (logo maskapai, dll.).
import { Client } from "minio"

// Instance MinIO client yang terhubung ke object storage server
export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin"
})

const BUCKET_NAME = "skyintern" // Nama bucket penyimpanan semua file aplikasi
export const MINIO_BUCKET_NAME = BUCKET_NAME

const sanitizeBaseUrl = (url: string) => url.replace(/\/+$/, "")

const getProxyPublicBaseUrl = () => {
  if (process.env.FILE_PUBLIC_BASE_URL) return process.env.FILE_PUBLIC_BASE_URL
  if (process.env.BACKEND_PUBLIC_URL) return process.env.BACKEND_PUBLIC_URL

  const port = process.env.PORT || "3000"
  return `http://localhost:${port}`
}

const getMinioPublicBaseUrl = () => {
  const explicitPublicUrl = process.env.MINIO_PUBLIC_URL?.trim()
  return explicitPublicUrl ? sanitizeBaseUrl(explicitPublicUrl) : null
}

const encodeObjectKey = (fileName: string) =>
  fileName
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")

const PUBLIC_READ_POLICY = JSON.stringify({
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Principal: { AWS: ["*"] },
      Action: ["s3:GetObject"],
      Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
    }
  ]
})

export const initializeBucket = async () => {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME) // Cek apakah bucket sudah ada di MinIO
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, "us-east-1")
      await minioClient.setBucketPolicy(BUCKET_NAME, PUBLIC_READ_POLICY)
      console.log(`✅ MinIO bucket "${BUCKET_NAME}" created successfully with public-read policy`)
    } else {
      await minioClient.setBucketPolicy(BUCKET_NAME, PUBLIC_READ_POLICY)
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

    return getFileUrl(fileName)
  } catch (error: any) {
    if (error.code === "ECONNREFUSED") {
      throw new Error("Server MinIO tidak berjalan. Fitur upload file dinonaktifkan.")
    }
    throw error
  }
}

export const getFileUrl = (fileName: string): string => {
  const minioPublicBaseUrl = getMinioPublicBaseUrl()
  if (minioPublicBaseUrl) {
    return `${minioPublicBaseUrl}/${BUCKET_NAME}/${encodeObjectKey(fileName)}`
  }

  return `${sanitizeBaseUrl(getProxyPublicBaseUrl())}/api/files?key=${encodeURIComponent(fileName)}`
}

export const extractFileKeyFromUrl = (fileUrl: string): string | null => {
  const trimmed = fileUrl.trim()
  if (!trimmed) return null

  try {
    const uri = new URL(trimmed)

    const queryKey = uri.searchParams.get("key")
    if (queryKey && queryKey.trim()) return decodeURIComponent(queryKey)

    const bucketSegment = `/${BUCKET_NAME}/`
    const bucketIndex = uri.pathname.indexOf(bucketSegment)
    if (bucketIndex >= 0) {
      const start = bucketIndex + bucketSegment.length
      const key = uri.pathname.slice(start)
      if (key) return decodeURIComponent(key)
    }
  } catch {
    return null
  }

  return null
}

export const normalizeFileUrl = (fileUrl: string | null | undefined): string | null => {
  if (!fileUrl) return null
  const key = extractFileKeyFromUrl(fileUrl)
  if (!key) return fileUrl
  return getFileUrl(key)
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
