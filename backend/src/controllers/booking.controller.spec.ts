import assert from "node:assert/strict";
import test from "node:test";
import * as controller from "./booking.controller";

test("[CREATE] booking controller exports are available", () => {
  assert.ok(Object.keys(controller).length > 0);
});

test("[READ] booking controller exports are available", () => {
  assert.ok(Object.keys(controller).length > 0);
});

test("[UPDATE] booking controller exports are available", () => {
  assert.ok(Object.keys(controller).length > 0);
});

test("[DELETE] booking controller exports are available", () => {
  assert.ok(Object.keys(controller).length > 0);
});
