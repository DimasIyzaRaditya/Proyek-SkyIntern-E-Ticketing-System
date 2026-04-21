import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/testdb";
process.env.JWT_SECRET ||= "dummy-secret";

const controller = require("./auth.controller") as typeof import("./auth.controller");
const prisma = require("../prisma/client").default as any;

const createMockResponse = () => {
  const res: any = {
    statusCode: 200,
    payload: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.payload = body;
      return this;
    }
  };

  return res;
};

test("[CREATE] register status 201 dan data user benar", async () => {
  const req: any = { body: { email: "user@test.com", name: "User", password: "secret123" } };
  const res = createMockResponse();
  const originalCreate = prisma.user.create;

  prisma.user.create = async ({ data }: any) => ({ id: 1, email: data.email, name: data.name });

  try {
    await controller.register(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.payload.user.email, "user@test.com");
  } finally {
    prisma.user.create = originalCreate;
  }
});

test("[READ] getProfile status 200 dan data sesuai", async () => {
  const req: any = { user: { id: 1 } };
  const res = createMockResponse();
  const originalFindUnique = prisma.user.findUnique;

  prisma.user.findUnique = async () => ({ id: 1, name: "User", email: "user@test.com", avatarUrl: null });

  try {
    await controller.getProfile(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.user.id, 1);
  } finally {
    prisma.user.findUnique = originalFindUnique;
  }
});

test("[UPDATE] updateProfile status 200 dan data berubah", async () => {
  const req: any = { user: { id: 1 }, body: { name: "User Updated", phone: "08123" } };
  const res = createMockResponse();
  const originalUpdate = prisma.user.update;

  prisma.user.update = async () => ({ id: 1, name: "User Updated", email: "user@test.com", phone: "08123", avatarUrl: null });

  try {
    await controller.updateProfile(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.user.name, "User Updated");
  } finally {
    prisma.user.update = originalUpdate;
  }
});

test("[DELETE] deleteAccount status 200 atau 204", async () => {
  const req: any = { user: { id: 1 }, params: { email: "user@test.com" } };
  const res = createMockResponse();
  const originalFindUnique = prisma.user.findUnique;
  const originalDelete = prisma.user.delete;

  prisma.user.findUnique = async () => ({ id: 1, email: "user@test.com" });
  prisma.user.delete = async () => ({ id: 1 });

  try {
    await controller.deleteAccount(req, res);

    assert.ok(res.statusCode === 200 || res.statusCode === 204);
  } finally {
    prisma.user.findUnique = originalFindUnique;
    prisma.user.delete = originalDelete;
  }
});
