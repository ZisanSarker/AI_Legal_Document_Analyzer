import express from "express";
import "dotenv/config";
import cors from "cors";
import morgan from "morgan";
import extractRouter from "./modules/document/document.route.js";
import semanticRouter from "./modules/semantic/semantic.route.js";
import fraudRouter from "./modules/fraud/fraud.route.js";

const app = express();

let server;
const PORT = process.env.PORT || "5000";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("Server working fine!");
});

app.use("/api/v1/docs", extractRouter);
app.use("/api/v1/semantic", semanticRouter);
app.use("/api/v1/fraud", fraudRouter);

const startServer = () => {
  server = app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
  });
};

startServer();
