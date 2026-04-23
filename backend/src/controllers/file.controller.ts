import { Request, Response } from "express"
import { MINIO_BUCKET_NAME, minioClient } from "../utils/minio"

export const getPublicFile = async (req: Request, res: Response) => {
  try {
    const rawKey = req.query.key
    const key = typeof rawKey === "string" ? rawKey.trim() : ""

    if (!key) {
      return res.status(400).json({ message: "Parameter key wajib diisi" })
    }

    const stat = await minioClient.statObject(MINIO_BUCKET_NAME, key)
    const contentType = stat.metaData?.["content-type"] || "application/octet-stream"

    const objectStream = await minioClient.getObject(MINIO_BUCKET_NAME, key)
    res.setHeader("Content-Type", contentType)
    res.setHeader("Cache-Control", "public, max-age=86400")
    objectStream.pipe(res)
  } catch (error: any) {
    const notFoundCodes = new Set(["NoSuchKey", "NoSuchObject", "NotFound"])
    if (notFoundCodes.has(String(error?.code))) {
      return res.status(404).json({ message: "File tidak ditemukan" })
    }

    if (error?.code === "ECONNREFUSED") {
      return res.status(503).json({ message: "Server penyimpanan file tidak tersedia" })
    }

    console.error("Get public file error:", error)
    return res.status(500).json({ message: "Terjadi kesalahan pada server" })
  }
}
