import React, { useState } from 'react'

export default function Patrimonio({ data, user, onRefresh, supabase }) {
  const { historico } = data
  const [mes, setMes] = useState('')
  const [patrimonio, setPatrimonio] = useState('')
  const [ahorro, setAhorro] = useState('')
  const [saving, setSaving] = useState(false)

  const addRegistro = async (e) => {
    e.preventDefault()
    if (!mes.trim()) return
    setSaving(true)
    await supabase.from('budget_entries').insert({
      user_name: user, type: 'historico',
      category: mes.trim(), amount: parseFloat(patrimonio) || 0,
      description: String(parseFloat(ahorro) || 0), month: 'historico'
    })
    setMes(''); setPatrimonio(''); setAhorro('')
    await onRefresh()
    setSaving(false)
  }

  const deleteRegistro = async (id) => {
    await supabase.from('budget_entries').delete().eq('id', id)
    onRefresh()
  }

  const last = historico[historico.length - 1]

  return (
    <div>
      <h2 className="section-title">Patrimonio</h2>
      {last && (
        <div className="metric-grid" style={{ marginBottom: 20 }}>
          <div className="metric-card"><div className="metric-label">Último patrimonio conjunto</div><div className="metric-value accent">{parseFloat(last.patrimonio).toLocaleString('es-ES', { minimumFractionDigits: 2 })}€</div></div>
          <div className="metric-card"><div className="metric-label">Último ahorro individual</div><div className="metric-value positive">{parseFloat(last.ahorro).toLocaleString('es-ES', { minimumFractionDigits: 2 })}€</div></div>
        </div>
      )}

      <form className="form-card" onSubmit={addRegistro}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>＋ Nuevo registro</div>
        <div className="form-row">
          <div className="form-group" style={{ maxWidth: 120 }}>
            <label className="form-label">Mes / Año</label>
            <input className="form-input" placeholder="Jun 2025" value={mes} onChange={e => setMes(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Patrimonio conjunto (€)</label>
            <input type="number" step="0.01" min="0" className="form-input" placeholder="0.00" value={patrimonio} onChange={e => setPatrimonio(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Mi ahorro individual (€)</label>
            <input type="number" step="0.01" min="0" className="form-input" placeholder="0.00" value={ahorro} onChange={e => setAhorro(e.target.value)} />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar registro'}</button>
      </form>

      {historico.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">△</div><p>No hay registros todavía</p></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Mes', 'Patrimonio conjunto', 'Ahorro individual', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historico.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>{item.mes}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--accent2)' }}>{parseFloat(item.patrimonio).toLocaleString('es-ES', { minimumFractionDigits: 2 })}€</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--green)' }}>{parseFloat(item.ahorro).toLocaleString('es-ES', { minimumFractionDigits: 2 })}€</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}><button className="delete-btn" onClick={() => deleteRegistro(item.id)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
