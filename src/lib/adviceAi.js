const aiAdviceEndpoint = String(import.meta.env.VITE_MONI_ADVICE_API_URL ?? '').trim()
const aiAdviceApiKey = String(import.meta.env.VITE_MONI_ADVICE_API_KEY ?? '').trim()
const aiAdviceEnabled = String(import.meta.env.VITE_MONI_ADVICE_ENABLED ?? '').toLowerCase() === 'true'

export function aiAdviceAvailable() {
  return aiAdviceEnabled && aiAdviceEndpoint.length > 0
}

function buildPayload(goal, items, baseSummary) {
  return {
    goal: goal
      ? {
          title: goal.title,
          targetAmount: goal.targetAmount,
          savedAmount: goal.savedAmount,
          monthsLeft: goal.monthsLeft,
          viability: goal.viability,
        }
      : null,
    priorities: (items ?? []).map((item) => ({
      id: item.id,
      tone: item.tone,
      title: item.title,
    })),
    baseSummary: String(baseSummary ?? ''),
    language: 'es-AR',
    style: 'coach financiero breve, concreto y accionable',
  }
}

export async function requestAiAdviceSummary(goal, items, baseSummary) {
  if (!aiAdviceAvailable()) return null
  const headers = {
    'Content-Type': 'application/json',
  }
  if (aiAdviceApiKey) headers.Authorization = `Bearer ${aiAdviceApiKey}`
  const response = await fetch(aiAdviceEndpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(buildPayload(goal, items, baseSummary)),
  })
  if (!response.ok) {
    throw new Error('No se pudo obtener la explicación asistida.')
  }
  const data = await response.json().catch(() => null)
  const text =
    typeof data?.summary === 'string'
      ? data.summary
      : typeof data?.message === 'string'
        ? data.message
        : ''
  return text.trim() || null
}
