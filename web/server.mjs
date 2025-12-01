// web/server.mjs
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4173;

// Servimos los archivos estáticos de dist
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

// ⬅️ ESTA ES LA LÍNEA QUE ROMPÍA
// app.get("*", (req, res) => {
//   res.sendFile(path.join(distPath, "index.html"));
// });

// ✅ Con Express 5, usá "/*" o una regex
app.get("/*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Web app escuchando en puerto ${PORT}`);
});
