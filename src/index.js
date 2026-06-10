require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/SwaggerConfig");
const connectDB = require("./config/DBConfig");
const adminUserRoutes = require("./routes/AdminUserRoute");
const moduleRoutes = require("./routes/ModuleRoute");
const roleRoutes = require("./routes/RoleRoute");
const locationRoutes = require("./routes/LocationRoute");
const familyRoutes = require("./routes/FamilyRoute");
const memberRoutes = require("./routes/MemberRoute");
const memberAdminRoutes = require("./routes/MemberAdminRoute");
const districtRoutes = require("./routes/DistrictRoute");
const tehsilRoutes = require("./routes/TehsilRoute");
const villageRoutes = require("./routes/VillageRoute");
const personRoutes = require("./routes/PersonRoute");
const dharamshalaRoutes = require("./routes/DharamshalaRoute");

const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads"), { maxAge: "1d" }));

app.use("/admin/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/admin/docs-json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use("/admin/user", adminUserRoutes);
app.use("/admin/module", moduleRoutes);
app.use("/admin/role", roleRoutes);
app.use("/admin/location", locationRoutes);
app.use("/admin/family", familyRoutes);
app.use("/admin/member", memberAdminRoutes);
app.use("/member", memberRoutes);
app.use("/admin/district", districtRoutes);
app.use("/admin/tehsil", tehsilRoutes);
app.use("/admin/village", villageRoutes);
app.use("/admin/person", personRoutes);
app.use("/admin/dharamshala", dharamshalaRoutes);

app.get("/health", (_, res) => res.json({ status: "up" }));

const PORT = process.env.PORT || 7000;
connectDB().then(() =>
  app.listen(PORT, () => console.log(`🚀 Admin Service running on port ${PORT}`))
);
