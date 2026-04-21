import assert from "node:assert/strict";
import test from "node:test";
import * as controller from "./seat.controller";

// @no-crud-required
test("[READ] seat controller exports are available", () => {
  assert.ok(Object.keys(controller).length > 0);
});
