import api from "../lib/apiClient";

// GET /v1/account/me
export function getAccountMe() {
  return api("/v1/account/me");
}

// PUT /v1/account/me   (nombre, dni)
export function updateAccountMe(payload) {
  return api("/v1/account/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}