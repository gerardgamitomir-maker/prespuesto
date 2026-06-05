import React, { useState, useEffect } from 'react'

export default function Libreta({ data, user, onRefresh, supabase }) {
  const [texto, setTexto] = useState(data.nota || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { setTexto(data.nota || '') }, [data.nota])

  const saveNota = async () => {
    setSaving(true)
    await supabase.from('budget_entries').delete().eq('user_name', user).eq('type', 'nota')
    if (texto.trim()) {
      await supabase.from('budget_entries').insert({
        user_name: user, type: 'nota', category: 'nota',
        amount: 0, description: texto, month: 'nota'
      })
    }
    await onRefresh()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <h2 className="section-title">Libreta</h2>
      <div className="form-card" style={{ padding: 0, overflow: 'hidden' }}>
        <textarea
          style={{ width: '100%', minHeight: 400, background: 'var(--bg2)', color: 'var(--text)', border: 'none', padding: '20px', fontSize: 15, lineHeight: 1.7, resize: 'vertical', display: 'block', fontFamily: 'DM Sans, sans-serif' }}
          placeholder="Escribe aquí tus notas, recordatorios, objetivos del mes..."
          value={texto} onChange={e => setTexto(e.target.value)}
        />
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-primary" onClick={saveNota} disabled={saving}>{saving ? 'Guardando...' : '💾 Guardar nota'}</button>
          {saved && <span style={{ fontSize: 13, color: 'var(--green)' }}>✓ Guardado</span>}
        </div>
      </div>
    </div>
  )
}
