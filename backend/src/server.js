import express from "express";
import "dotenv/config";
import cors from "cors";
import morgan from "morgan";
import extractRouter from "./modules/document/document.route.js";
import fraudRouter from "./modules/fraud/fraud.route.js";

const app = express();

let server;
const PORT = process.env.PORT || "5000";

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("dev"));

// Routes
app.get("/", (req, res) => {
  res.send("Server working fine!");
});

app.use("/api/v1/docs", extractRouter);
app.use("/api/v1/fraud", fraudRouter);

const startServer = () => {
  server = app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
  });
};

startServer();
