const Redis = require("ioredis");
const client = new Redis(process.env.REDIS_URL || "redis://:camel@123@13.61.199.168:4000");
client.on("connect", () => console.log("Admin Redis connected"));
client.on("error", (e) => console.error("Redis error", e.message));
module.exports = client;
