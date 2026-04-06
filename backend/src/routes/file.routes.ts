import { Router } from "express"
import { getPublicFile } from "../controllers/file.controller"

const router = Router()

router.get("/", getPublicFile)

export default router
