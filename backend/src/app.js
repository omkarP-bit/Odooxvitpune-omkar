const express = require("express");
const cors = require("cors");
const rootRoutes = require("./routes");
const { errorMiddleware } = require("./middleware/errorMiddleware");

const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);
app.use(express.json());
app.use("/", rootRoutes);
app.use(errorMiddleware);

module.exports = app;
