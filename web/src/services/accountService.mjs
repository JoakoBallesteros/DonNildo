import api from "../lib/apiClient";


export function getAccountMe() {
  return api("/v1/account/me");
}


export function updateAccountMe(payload) {
  return api("/v1/account/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}