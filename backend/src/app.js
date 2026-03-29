const express = require("express");
const rootRoutes = require("./routes");

const app = express();

app.use(express.json());
app.use("/", rootRoutes);

module.exports = app;
