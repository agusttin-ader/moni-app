const { onRequest } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')

const openAiKey = defineSecret('OPENAI_API_KEY')
const adviceBearer = defineSecret('MONI_ADVICE_BEARER')

const REGION = 'southamerica-east1'

function buildCoachPrompt(body) {
  const safe = typeof body === 'object' && body !== null ? body : {}
  return `Sos un coach financiero para Argentina (es-AR). Respondé en español rioplatense, breve (máx. 6 oraciones cortas), concreto y accionable.

Reglas:
- No inventes montos ni fechas: usá solo la información del JSON.
- Si falta la meta o no hay prioridades, indicá amablemente que carguen meta y datos.
- Priorizá una sola acción siguiente cuando sea posible.

Datos de MONI (JSON):
${JSON.stringify(safe, null, 2)}`
}

/**
 * HTTPS endpoint compatible con src/lib/adviceAi.js (POST JSON → { summary }).
 * Protegido con Authorization: Bearer <mismo valor que MONI_ADVICE_BEARER en Firebase>.
 */
exports.moniAdvice = onRequest(
  {
    cors: true,
    region: REGION,
    secrets: [openAiKey, adviceBearer],
    timeoutSeconds: 60,
    memory: '256MiB',
    maxInstances: 10,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const authHeader = String(req.headers.authorization || '').trim()
    const expected = `Bearer ${adviceBearer.value().trim()}`
    if (authHeader !== expected) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const body = req.body
    if (!body || typeof body !== 'object') {
      res.status(400).json({ error: 'Expected JSON body' })
      return
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey.value().trim()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'Sos un asistente de educación financiera. No das asesoramiento de inversión regulado; ofrecés ideas generales y hábitos.',
            },
            { role: 'user', content: buildCoachPrompt(body) },
          ],
          max_tokens: 500,
          temperature: 0.4,
        }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        const errMsg =
          data?.error?.message || response.statusText || 'OpenAI request failed'
        console.error('OpenAI error', response.status, errMsg)
        res.status(502).json({ error: 'Upstream model error', message: errMsg })
        return
      }

      const summary = String(data?.choices?.[0]?.message?.content ?? '').trim()
      res.status(200).json({ summary })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Internal error' })
    }
  },
)
