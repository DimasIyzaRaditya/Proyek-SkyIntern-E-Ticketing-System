import assert from "node:assert/strict";
import test from "node:test";
import * as controller from "./airport.controller";

test("[CREATE] airport controller exports are available", () => {
  assert.ok(Object.keys(controller).length > 0);
});

test("[READ] airport controller exports are available", () => {
  assert.ok(Object.keys(controller).length > 0);
});

test("[UPDATE] airport controller exports are available", () => {
  assert.ok(Object.keys(controller).length > 0);
});

test("[DELETE] airport controller exports are available", () => {
  assert.ok(Object.keys(controller).length > 0);
});
