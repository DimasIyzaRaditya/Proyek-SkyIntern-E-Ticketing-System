import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/testdb";

const controller = require("./promo.controller") as typeof import("./promo.controller");
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

test("[CREATE] createPromo status 201 dan data benar", async () => {
  const req: any = {
    body: {
      title: "Promo Lebaran",
      startDate: "2026-05-01T00:00:00.000Z",
      endDate: "2026-05-30T00:00:00.000Z"
    }
  };
  const res = createMockResponse();
  const originalCreate = prisma.promo.create;

  prisma.promo.create = async ({ data }: any) => ({ id: 1, ...data });

  try {
    await controller.createPromo(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.payload.promo.title, "Promo Lebaran");
  } finally {
    prisma.promo.create = originalCreate;
  }
});

test("[READ] getAllPromos status 200 dan data sesuai", async () => {
  const req: any = {};
  const res = createMockResponse();
  const rows = [{ id: 1, title: "Promo Lebaran" }];
  const originalFindMany = prisma.promo.findMany;

  prisma.promo.findMany = async () => rows;

  try {
    await controller.getAllPromos(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.payload.promos, rows);
  } finally {
    prisma.promo.findMany = originalFindMany;
  }
});

test("[UPDATE] updatePromo status 200 dan data berubah", async () => {
  const req: any = {
    params: { id: "1" },
    body: { title: "Promo Updated" }
  };
  const res = createMockResponse();
  const originalFindUnique = prisma.promo.findUnique;
  const originalUpdate = prisma.promo.update;

  prisma.promo.findUnique = async () => ({
    id: 1,
    title: "Promo Lebaran",
    startDate: new Date("2026-05-01T00:00:00.000Z"),
    endDate: new Date("2026-05-30T00:00:00.000Z"),
    description: null,
    discount: 0,
    isActive: true,
    flightId: null
  });
  prisma.promo.update = async ({ data }: any) => ({ id: 1, ...data });

  try {
    await controller.updatePromo(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.promo.title, "Promo Updated");
  } finally {
    prisma.promo.findUnique = originalFindUnique;
    prisma.promo.update = originalUpdate;
  }
});

test("[DELETE] deletePromo status 200 atau 204", async () => {
  const req: any = { params: { id: "1" } };
  const res = createMockResponse();
  const originalFindUnique = prisma.promo.findUnique;
  const originalDelete = prisma.promo.delete;

  prisma.promo.findUnique = async () => ({ id: 1 });
  prisma.promo.delete = async () => ({ id: 1 });

  try {
    await controller.deletePromo(req, res);

    assert.ok(res.statusCode === 200 || res.statusCode === 204);
  } finally {
    prisma.promo.findUnique = originalFindUnique;
    prisma.promo.delete = originalDelete;
  }
});
