# Cloud Function `moniAdvice`

Expone el POST que usa la app (`src/lib/adviceAi.js`). Requiere **OpenAI** y un **token compartido** entre Firebase y el front.

## Despliegue (fuera del editor)

1. **Instalar CLI** (si no la tenés): `npm install -g firebase-tools`
2. **Iniciar sesión**: `firebase login`
3. **Asociar el proyecto** (en la raíz de `moni-app`, donde está `firebase.json`):
   - Editá `.firebaserc` y reemplazá `TU_PROJECT_ID_DE_FIREBASE` por tu Project ID de la consola Firebase, **o**
   - Ejecutá `firebase use --add` y elegí el proyecto.
4. **Facturación (Blaze)**: las Functions con secretos / llamadas salientes suelen requerir plan Blaze en el proyecto Firebase.
5. **Crear secretos** (mismo proyecto):

   ```bash
   firebase functions:secrets:set OPENAI_API_KEY
   # Pegá la API key de OpenAI (plataforma.openai.com → API keys)

   firebase functions:secrets:set MONI_ADVICE_BEARER
   # Pegá un string largo aleatorio (misma cadena irá al front como VITE_MONI_ADVICE_API_KEY)
   ```

6. **Instalar dependencias de la function**:

   ```bash
   cd functions && npm install && cd ..
   ```

7. **Deploy**:

   ```bash
   firebase deploy --only functions:moniAdvice
   ```

8. **URL del front**: al terminar, la CLI muestra la URL HTTP. Típicamente:

   `https://southamerica-east1-<PROJECT_ID>.cloudfunctions.net/moniAdvice`

   (Si cambiás `REGION` en `index.js`, el subdominio coincide con esa región.)

9. **Variables del cliente (Vite)** en `.env` / panel de hosting:

   ```bash
   VITE_MONI_ADVICE_API_URL=https://southamerica-east1-TU_PROJECT_ID.cloudfunctions.net/moniAdvice
   VITE_MONI_ADVICE_API_KEY=<el mismo valor que MONI_ADVICE_BEARER>
   ```

10. Reiniciá `npm run dev` o volvé a **build + deploy** del sitio estático para que tome las `VITE_*`.

## Probar con curl

```bash
curl -sS -X POST 'https://southamerica-east1-TU_PROJECT_ID.cloudfunctions.net/moniAdvice' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer TU_MONI_ADVICE_BEARER' \
  -d '{"baseSummary":"Prueba","priorities":[],"goal":null,"language":"es-AR"}'
```

Deberías recibir `{"summary":"..."}`.
