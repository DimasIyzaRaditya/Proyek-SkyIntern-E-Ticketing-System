import test from "node:test";
import assert from "node:assert/strict";

import {
  addMinutes,
  calculateTotalPrice,
  generateBookingCode,
  generateResetToken,
  generateTicketNumber,
} from "./helpers";

test("generateBookingCode returns 6 uppercase alphanumeric chars", () => {
  const code = generateBookingCode();

  assert.equal(code.length, 6);
  assert.match(code, /^[A-Z0-9]{6}$/);
});

test("generateResetToken returns 64 hex chars", () => {
  const token = generateResetToken();

  assert.equal(token.length, 64);
  assert.match(token, /^[a-f0-9]{64}$/);
});

test("generateTicketNumber matches expected format", () => {
  const ticketNumber = generateTicketNumber();

  assert.match(ticketNumber, /^TKT\d{12}$/);
});

test("calculateTotalPrice includes all components", () => {
  const total = calculateTotalPrice(100000, 12000, 5000, 20000, 2);

  assert.equal(total, 237000);
});

test("addMinutes returns date plus provided minutes", () => {
  const baseDate = new Date("2026-04-16T10:00:00.000Z");
  const updatedDate = addMinutes(baseDate, 45);

  assert.equal(updatedDate.toISOString(), "2026-04-16T10:45:00.000Z");
});
