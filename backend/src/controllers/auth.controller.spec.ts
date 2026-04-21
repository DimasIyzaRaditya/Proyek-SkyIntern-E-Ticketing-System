import assert from "node:assert/strict";
import test from "node:test";
import * as controller from "./auth.controller";

// @no-crud-required
test("[READ] auth controller exports are available", () => {
  assert.ok(Object.keys(controller).length > 0);
});
