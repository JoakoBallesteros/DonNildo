// web/server.mjs
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4173;

// Ruta a la carpeta dist
const distPath = path.join(__dirname, "dist");

// Servir archivos estáticos
app.use(express.static(distPath));

// ⬇️ Fallback para SPA (USAMOS REGEX, NO STRING CON *)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Web app escuchando en puerto ${PORT}`);
});
