import assert from "node:assert/strict";
import test from "node:test";
import * as controller from "./flight.controller";

test("[CREATE] flight controller exports are available", () => {
  assert.ok(Object.keys(controller).length > 0);
});

test("[READ] flight controller exports are available", () => {
  assert.ok(Object.keys(controller).length > 0);
});

test("[UPDATE] flight controller exports are available", () => {
  assert.ok(Object.keys(controller).length > 0);
});

test("[DELETE] flight controller exports are available", () => {
  assert.ok(Object.keys(controller).length > 0);
});
