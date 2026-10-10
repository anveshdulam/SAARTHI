import { logger } from "../backend/src/logger.js";
logger.debug("Test debug message");
logger.info("Test info message", { custom: "field" });
logger.warn("Test warn message");
logger.error("Test error message", { error: new Error("Test failure") });
