# Configuración del servidor MCP de GitHub

Este documento te guiará para configurar el servidor de **Model Context Protocol (MCP)** de GitHub, permitiéndole a la IA leer repositorios, crear Pull Requests, gestionar issues y más.

## 1. Generar un Token de Acceso Personal (PAT) en GitHub

Para que el servidor MCP se autentique correctamente, necesitas un token de acceso:

1. Ve a GitHub y accede a **Settings** (Configuración) desde el menú de tu perfil.
2. Navega a **Developer settings** (al final del menú izquierdo).
3. Selecciona **Personal access tokens** -> **Tokens (classic)** (o Fine-grained, pero Classic suele ser más fácil de configurar para todas las capacidades iniciales).
4. Haz clic en **Generate new token (classic)**.
5. Dale un nombre identificativo (ej. `Antigravity MCP GitHub`).
6. **Permisos (Scopes) necesarios:**
   - Selecciona `repo` (Full control of private repositories).
   - Opcionalmente selecciona `read:org` si necesitas acceder a repositorios de organizaciones.
   - Opcionalmente selecciona `admin:repo_hook` si tienes pensado gestionar webhooks.
7. Haz clic en **Generate token**.
8. **Copia el token** (empezará por `ghp_...`). Guárdalo temporalmente en un lugar seguro, ya que GitHub no volverá a mostrártelo.

## 2. Configurar el Servidor MCP

Añade el servidor de GitHub a tu configuración de servidores MCP (dependiendo del entorno, la configuración puede estar en un archivo `.json` de configuración global o gestionarse desde la interfaz gráfica):

Si tienes un archivo de configuración (ej. `mcp-settings.json` o similar), deberás agregar lo siguiente:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "TU_TOKEN_AQUI"
      }
    }
  }
}
```

> Reemplaza `"TU_TOKEN_AQUI"` con el token `ghp_...` que acabas de generar.

## 3. Verificar y Probar

1. Reinicia tu agente (Antigravity/Claude).
2. Pregúntame algo como: _"¿Cuáles son mis repositorios recientes en GitHub?"_ o _"Busca los issues abiertos en este repositorio"_.
3. Si la conexión es exitosa, podré leer tus repos directamente mediante mis herramientas MCP.

---
**Nota:** Nunca hagas commit de este token al repositorio. Si por algún motivo se te filtra accidentalmente, GitHub lo revocará de inmediato y tendrás que generar uno nuevo.
