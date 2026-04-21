import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/testdb";
process.env.MIDTRANS_SERVER_KEY ||= "dummy";
process.env.MIDTRANS_CLIENT_KEY ||= "dummy";
process.env.JWT_SECRET ||= "dummy";

const controller = require("./booking.controller") as typeof import("./booking.controller");
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

test("[CREATE] createBooking status 201 dan data benar", async () => {
  const req: any = {
    user: { id: 11, role: "USER" },
    body: {
      flightId: 100,
      passengers: [{ type: "ADULT", firstName: "Budi", lastName: "Santoso" }],
      seatIds: []
    }
  };
  const res = createMockResponse();
  const originalFlightFindUnique = prisma.flight.findUnique;
  const originalPromoFindMany = prisma.promo.findMany;
  const originalBookingCreate = prisma.booking.create;

  prisma.flight.findUnique = async () => ({ id: 100, basePrice: 1000000, tax: 10000, adminFee: 5000 });
  prisma.promo.findMany = async () => [];
  prisma.booking.create = async ({ data }: any) => ({ id: 1, bookingCode: data.bookingCode, status: "PENDING" });

  try {
    await controller.createBooking(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.payload.booking.status, "PENDING");
  } finally {
    prisma.flight.findUnique = originalFlightFindUnique;
    prisma.promo.findMany = originalPromoFindMany;
    prisma.booking.create = originalBookingCreate;
  }
});

test("[READ] verifyBookingByCode status 200 dan data sesuai", async () => {
  const req: any = { query: { code: "ABC123" } };
  const res = createMockResponse();
  const row = { id: 1, bookingCode: "ABC123", status: "PENDING" };
  const originalFindUnique = prisma.booking.findUnique;

  prisma.booking.findUnique = async () => row;

  try {
    await controller.verifyBookingByCode(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.payload.booking, row);
  } finally {
    prisma.booking.findUnique = originalFindUnique;
  }
});

test("[UPDATE] updateAdminBookingStatus status 200 dan data berubah", async () => {
  const req: any = { params: { id: "1" }, body: { action: "markpaid" } };
  const res = createMockResponse();
  const originalFindUnique = prisma.booking.findUnique;
  const originalUpdate = prisma.booking.update;

  prisma.booking.findUnique = async () => ({ id: 1, bookingCode: "ABC123", flight: { flightNumber: "GA100" }, ticket: null });
  prisma.booking.update = async () => ({ id: 1, status: "PAID" });

  try {
    await controller.updateAdminBookingStatus(req, res);

    assert.equal(res.statusCode, 200);
    assert.match(res.payload.message, /Paid/i);
  } finally {
    prisma.booking.findUnique = originalFindUnique;
    prisma.booking.update = originalUpdate;
  }
});

test("[DELETE] cancelBooking status 200 atau 204", async () => {
  const req: any = { params: { id: "1" }, user: { id: 11, role: "USER" } };
  const res = createMockResponse();
  const originalFindUnique = prisma.booking.findUnique;
  const originalUpdate = prisma.booking.update;
  const originalUpdateMany = prisma.flightSeat.updateMany;

  prisma.booking.findUnique = async () => ({ id: 1, userId: 11, status: "PENDING", bookingCode: "ABC123" });
  prisma.booking.update = async () => ({ id: 1, status: "CANCELLED" });
  prisma.flightSeat.updateMany = async () => ({ count: 0 });

  try {
    await controller.cancelBooking(req, res);

    assert.ok(res.statusCode === 200 || res.statusCode === 204);
    assert.match(res.payload.message, /dibatalkan/i);
  } finally {
    prisma.booking.findUnique = originalFindUnique;
    prisma.booking.update = originalUpdate;
    prisma.flightSeat.updateMany = originalUpdateMany;
  }
});
