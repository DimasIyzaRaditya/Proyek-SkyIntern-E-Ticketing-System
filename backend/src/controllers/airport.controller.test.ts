import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/testdb";

const controller = require("./airport.controller") as typeof import("./airport.controller");
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

test("[CREATE] createAirport status 201 dan data benar", async () => {
  const req: any = {
    body: { name: "Soekarno Hatta", city: "Jakarta", country: "Indonesia", timezone: "Asia/Jakarta" }
  };
  const res = createMockResponse();
  const originalCreate = prisma.airport.create;

  prisma.airport.create = async ({ data }: any) => ({ id: 1, ...data });

  try {
    await controller.createAirport(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.payload.airport.name, "Soekarno Hatta");
  } finally {
    prisma.airport.create = originalCreate;
  }
});

test("[READ] getAllAirports status 200 dan data sesuai", async () => {
  const req: any = {};
  const res = createMockResponse();
  const rows = [{ id: 1, name: "Soekarno Hatta", city: "Jakarta", country: "Indonesia", timezone: "Asia/Jakarta" }];
  const originalFindMany = prisma.airport.findMany;

  prisma.airport.findMany = async () => rows;

  try {
    await controller.getAllAirports(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.payload.airports, rows);
  } finally {
    prisma.airport.findMany = originalFindMany;
  }
});

test("[UPDATE] updateAirport status 200 dan data berubah", async () => {
  const req: any = {
    params: { id: "1" },
    body: { name: "Soetta", city: "Jakarta", country: "Indonesia", timezone: "Asia/Jakarta" }
  };
  const res = createMockResponse();
  const originalUpdate = prisma.airport.update;

  prisma.airport.update = async () => ({ id: 1, name: "Soetta", city: "Jakarta", country: "Indonesia", timezone: "Asia/Jakarta" });

  try {
    await controller.updateAirport(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.airport.name, "Soetta");
  } finally {
    prisma.airport.update = originalUpdate;
  }
});

test("[DELETE] deleteAirport status 200 atau 204", async () => {
  const req: any = { params: { id: "1" } };
  const res = createMockResponse();
  const originalDelete = prisma.airport.delete;

  prisma.airport.delete = async () => ({ id: 1 });

  try {
    await controller.deleteAirport(req, res);

    assert.ok(res.statusCode === 200 || res.statusCode === 204);
  } finally {
    prisma.airport.delete = originalDelete;
  }
});
