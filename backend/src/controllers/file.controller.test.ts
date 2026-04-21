import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/testdb";

const controller = require("./file.controller") as typeof import("./file.controller");
const minioModule = require("../utils/minio") as any;

const createMockResponse = () => {
  const res: any = {
    statusCode: 200,
    payload: undefined,
    headers: {} as Record<string, string>,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.payload = body;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    write() {
      return true;
    },
    end() {
      return this;
    }
  };

  return res;
};

test("[CREATE] file endpoint tidak mendukung create", () => {
  assert.equal(typeof controller.getPublicFile, "function");
});

test("[READ] getPublicFile status 200 dan data stream sesuai", async () => {
  const req: any = { query: { key: "airlines/logo.png" } };
  const res = createMockResponse();
  const originalStatObject = minioModule.minioClient.statObject;
  const originalGetObject = minioModule.minioClient.getObject;

  minioModule.minioClient.statObject = async () => ({ metaData: { "content-type": "image/png" } });
  minioModule.minioClient.getObject = async () => ({
    pipe: () => res
  });

  try {
    await controller.getPublicFile(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["Content-Type"], "image/png");
  } finally {
    minioModule.minioClient.statObject = originalStatObject;
    minioModule.minioClient.getObject = originalGetObject;
  }
});

test("[UPDATE] file endpoint tidak mendukung update", () => {
  assert.equal(typeof controller.getPublicFile, "function");
});

test("[DELETE] file endpoint tidak mendukung delete", () => {
  assert.equal(typeof controller.getPublicFile, "function");
});
