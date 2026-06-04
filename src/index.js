require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const connectDB = require("./config/DBConfig");
const adminUserRoutes = require("./routes/AdminUserRoute");
const moduleRoutes = require("./routes/ModuleRoute");
const roleRoutes = require("./routes/RoleRoute");
const locationRoutes = require("./routes/LocationRoute");
const familyRoutes = require("./routes/FamilyRoute");
const memberRoutes = require("./routes/MemberRoute");
const memberAdminRoutes = require("./routes/MemberAdminRoute");
const swaggerSpec = require("./config/SwaggerConfig");

const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads"), { maxAge: "1d" }));

app.use("/admin/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/admin/user", adminUserRoutes);
app.use("/admin/module", moduleRoutes);
app.use("/admin/role", roleRoutes);
app.use("/admin/location", locationRoutes);
app.use("/admin/family", familyRoutes);
app.use("/admin/member", memberAdminRoutes);
app.use("/member", memberRoutes);

app.get("/health", (_, res) => res.json({ status: "up" }));

const PORT = process.env.PORT || 7000;
connectDB().then(() =>
  app.listen(PORT, () => console.log(`🚀 Admin Service running on port ${PORT}`))
);
