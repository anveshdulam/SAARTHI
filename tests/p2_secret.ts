import { logger } from "../backend/src/logger.js";
logger.info("Testing secrets", {
  SAARTHI_AUTH_TOKEN: "secret1",
  INTERNAL_SECRET: "secret2",
  Authorization: "secret3",
  "Bearer token": "secret4",
  Cookie: "secret5",
  "Set-Cookie": "secret6",
  AWS_ACCESS_KEY_ID: "secret7",
  AWS_SECRET_ACCESS_KEY: "secret8",
  AWS_SESSION_TOKEN: "secret9",
  "session secrets": "secret10",
  request: { headers: { authorization: "nested_secret" } }
});
