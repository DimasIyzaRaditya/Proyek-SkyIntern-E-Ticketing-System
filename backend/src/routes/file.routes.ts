import { Router } from "express"
import { getPublicFile } from "../controllers/file.controller"

const router = Router()

/**
 * @swagger
 * /api/files:
 *   get:
 *     summary: Get public file from storage proxy
 *     tags: [Files]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Object key di bucket MinIO
 *         example: airlines/GA-1777350145195.png
 *     responses:
 *       200:
 *         description: File returned successfully
 *       400:
 *         description: Key is required or invalid
 *       404:
 *         description: File not found
 */
router.get("/", getPublicFile)

export default router
