import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/testdb";

const controller = require("./flight.controller") as typeof import("./flight.controller");
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

test("[CREATE] createFlight status 201 dan data benar", async () => {
  const req: any = {
    body: {
      flightNumber: "GA100",
      airlineId: "1",
      originId: "1",
      destinationId: "2",
      departureTime: "2026-05-01T10:00:00.000Z",
      arrivalTime: "2026-05-01T12:00:00.000Z",
      basePrice: 1000000
    }
  };
  const res = createMockResponse();
  const originalAirlineFindUnique = prisma.airline.findUnique;
  const originalAirportFindUnique = prisma.airport.findUnique;
  const originalFlightCreate = prisma.flight.create;

  prisma.airline.findUnique = async () => ({ id: 1 });
  prisma.airport.findUnique = async ({ where }: any) => ({ id: where.id });
  prisma.flight.create = async ({ data }: any) => ({ id: 10, ...data });

  try {
    await controller.createFlight(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.payload.flight.flightNumber, "GA100");
  } finally {
    prisma.airline.findUnique = originalAirlineFindUnique;
    prisma.airport.findUnique = originalAirportFindUnique;
    prisma.flight.create = originalFlightCreate;
  }
});

test("[READ] getAllFlightsAdmin status 200 dan data sesuai", async () => {
  const req: any = {};
  const res = createMockResponse();
  const rows = [{ id: 10, flightNumber: "GA100" }];
  const originalFindMany = prisma.flight.findMany;

  prisma.flight.findMany = async () => rows;

  try {
    await controller.getAllFlightsAdmin(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.payload.flights, rows);
  } finally {
    prisma.flight.findMany = originalFindMany;
  }
});

test("[UPDATE] updateFlight status 200 dan data berubah", async () => {
  const req: any = {
    params: { id: "10" },
    body: {
      flightNumber: "GA101",
      departureTime: "2026-05-01T10:00:00.000Z",
      arrivalTime: "2026-05-01T12:00:00.000Z"
    }
  };
  const res = createMockResponse();
  const originalUpdate = prisma.flight.update;

  prisma.flight.update = async ({ data }: any) => ({ id: 10, ...data });

  try {
    await controller.updateFlight(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.flight.flightNumber, "GA101");
  } finally {
    prisma.flight.update = originalUpdate;
  }
});

test("[DELETE] deleteFlight status 200 atau 204", async () => {
  const req: any = { params: { id: "10" } };
  const res = createMockResponse();
  const originalDelete = prisma.flight.delete;

  prisma.flight.delete = async () => ({ id: 10 });

  try {
    await controller.deleteFlight(req, res);

    assert.ok(res.statusCode === 200 || res.statusCode === 204);
  } finally {
    prisma.flight.delete = originalDelete;
  }
});
