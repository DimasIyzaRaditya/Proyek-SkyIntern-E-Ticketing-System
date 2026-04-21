import assert from "node:assert/strict";
import test from "node:test";
import * as controller from "./airline.controller";

test("[CREATE] airline controller exports are available", () => {
  assert.ok(Object.keys(controller).length > 0);
});

test("[READ] airline controller exports are available", () => {
  assert.ok(Object.keys(controller).length > 0);
});

test("[UPDATE] airline controller exports are available", () => {
  assert.ok(Object.keys(controller).length > 0);
});

test("[DELETE] airline controller exports are available", () => {
  assert.ok(Object.keys(controller).length > 0);
});
