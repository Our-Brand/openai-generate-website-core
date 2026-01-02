import "dotenv/config";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";

import userController from "./controllers/userController.js";
import projectController from "./controllers/projectController.js";
import generateController from "./controllers/generateController.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/swagger/index.html", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount controllers under /api
app.use("/api", userController);
app.use("/api", projectController);
app.use("/api", generateController);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AI site builder server running at http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/swagger/index.html`);
});
