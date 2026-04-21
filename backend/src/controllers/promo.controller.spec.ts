import assert from "node:assert/strict";
import test from "node:test";
import * as controller from "./promo.controller";

test("[CREATE] promo controller exports are available", () => {
  assert.ok(Object.keys(controller).length > 0);
});

test("[READ] promo controller exports are available", () => {
  assert.ok(Object.keys(controller).length > 0);
});

test("[UPDATE] promo controller exports are available", () => {
  assert.ok(Object.keys(controller).length > 0);
});

test("[DELETE] promo controller exports are available", () => {
  assert.ok(Object.keys(controller).length > 0);
});
