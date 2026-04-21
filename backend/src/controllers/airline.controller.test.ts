import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/testdb";

const controller = require("./airline.controller") as typeof import("./airline.controller");
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

test("[CREATE] createAirline status 201 dan data benar", async () => {
  const req: any = { body: { code: "GA", name: "Garuda", country: "Indonesia" } };
  const res = createMockResponse();
  const originalCreate = prisma.airline.create;

  prisma.airline.create = async ({ data }: any) => ({ id: 1, ...data, logo: null });

  try {
    await controller.createAirline(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.payload.airline.code, "GA");
    assert.equal(res.payload.airline.name, "Garuda");
  } finally {
    prisma.airline.create = originalCreate;
  }
});

test("[READ] getAllAirlines status 200 dan data sesuai", async () => {
  const req: any = {};
  const res = createMockResponse();
  const rows = [{ id: 1, code: "GA", name: "Garuda", country: "Indonesia", logo: null }];
  const originalFindMany = prisma.airline.findMany;

  prisma.airline.findMany = async () => rows;

  try {
    await controller.getAllAirlines(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.payload.airlines, rows);
  } finally {
    prisma.airline.findMany = originalFindMany;
  }
});

test("[UPDATE] updateAirline status 200 dan data berubah", async () => {
  const req: any = {
    params: { id: "1" },
    body: { code: "GA", name: "Garuda Updated", country: "Indonesia" }
  };
  const res = createMockResponse();
  const originalFindUnique = prisma.airline.findUnique;
  const originalUpdate = prisma.airline.update;

  prisma.airline.findUnique = async () => ({ id: 1, code: "GA", name: "Garuda", country: "Indonesia", logo: null });
  prisma.airline.update = async () => ({ id: 1, code: "GA", name: "Garuda Updated", country: "Indonesia", logo: null });

  try {
    await controller.updateAirline(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.airline.name, "Garuda Updated");
  } finally {
    prisma.airline.findUnique = originalFindUnique;
    prisma.airline.update = originalUpdate;
  }
});

test("[DELETE] deleteAirline status 200 atau 204", async () => {
  const req: any = { params: { id: "1" } };
  const res = createMockResponse();
  const originalFindUnique = prisma.airline.findUnique;
  const originalDelete = prisma.airline.delete;

  prisma.airline.findUnique = async () => ({ id: 1, logo: null });
  prisma.airline.delete = async () => ({ id: 1 });

  try {
    await controller.deleteAirline(req, res);

    assert.ok(res.statusCode === 200 || res.statusCode === 204);
  } finally {
    prisma.airline.findUnique = originalFindUnique;
    prisma.airline.delete = originalDelete;
  }
});
