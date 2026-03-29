const express = require("express");
const rootRoutes = require("./routes");
const { errorMiddleware } = require("./middleware/errorMiddleware");

const app = express();

app.use(express.json());
app.use("/", rootRoutes);
app.use(errorMiddleware);

module.exports = app;
