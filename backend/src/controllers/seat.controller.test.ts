import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/testdb";

const controller = require("./seat.controller") as typeof import("./seat.controller");
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

test("[CREATE] createFlightSeats status 201 dan data benar", async () => {
  const req: any = {
    body: {
      flightId: "10",
      seats: [{ seatNumber: "1A", seatClass: "BUSINESS", additionalPrice: 100000 }]
    }
  };
  const res = createMockResponse();
  const originalFlightFindUnique = prisma.flight.findUnique;
  const originalSeatFindFirst = prisma.seat.findFirst;
  const originalSeatCreate = prisma.seat.create;
  const originalFlightSeatCreate = prisma.flightSeat.create;

  prisma.flight.findUnique = async () => ({ id: 10 });
  prisma.seat.findFirst = async () => null;
  prisma.seat.create = async () => ({ id: 1, seatNumber: "1A", seatClass: "BUSINESS" });
  prisma.flightSeat.create = async () => ({ id: 100, seat: { seatNumber: "1A", seatClass: "BUSINESS" } });

  try {
    await controller.createFlightSeats(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.payload.seats.length, 1);
  } finally {
    prisma.flight.findUnique = originalFlightFindUnique;
    prisma.seat.findFirst = originalSeatFindFirst;
    prisma.seat.create = originalSeatCreate;
    prisma.flightSeat.create = originalFlightSeatCreate;
  }
});

test("[READ] getSeatMap status 200 dan data sesuai", async () => {
  const req: any = { params: { flightId: "10" } };
  const res = createMockResponse();
  const originalFindMany = prisma.flightSeat.findMany;

  prisma.flightSeat.findMany = async () => [
    { id: 1, seat: { seatClass: "ECONOMY", seatNumber: "10A" } },
    { id: 2, seat: { seatClass: "BUSINESS", seatNumber: "1A" } }
  ];

  try {
    await controller.getSeatMap(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.seatMap.ECONOMY.length, 1);
    assert.equal(res.payload.seatMap.BUSINESS.length, 1);
  } finally {
    prisma.flightSeat.findMany = originalFindMany;
  }
});

test("[UPDATE] updateFlightSeat status 200 dan data berubah", async () => {
  const req: any = { params: { id: "100" }, body: { status: "BOOKED", additionalPrice: 120000 } };
  const res = createMockResponse();
  const originalUpdate = prisma.flightSeat.update;

  prisma.flightSeat.update = async () => ({ id: 100, status: "BOOKED", additionalPrice: 120000, seat: { seatNumber: "1A" } });

  try {
    await controller.updateFlightSeat(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.seat.status, "BOOKED");
  } finally {
    prisma.flightSeat.update = originalUpdate;
  }
});

test("[DELETE] releaseSeats status 200 atau 204", async () => {
  const req: any = { params: { flightId: "10" }, body: { seatIds: [100] } };
  const res = createMockResponse();
  const originalUpdateMany = prisma.flightSeat.updateMany;

  prisma.flightSeat.updateMany = async () => ({ count: 1 });

  try {
    await controller.releaseSeats(req, res);

    assert.ok(res.statusCode === 200 || res.statusCode === 204);
  } finally {
    prisma.flightSeat.updateMany = originalUpdateMany;
  }
});
