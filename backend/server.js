require("dotenv").config();
const app = require("./src/app");
const logger = require("./src/config/logger");

const port = Number(process.env.PORT || 5000);

app.listen(port, () => {
  logger.info(`Backend listening on port ${port}`);
});
