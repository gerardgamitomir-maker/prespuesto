import React, { useState } from 'react'

export default function GastoVariable({ data, user, onRefresh, supabase }) {
  const { variables, presupuestoV } = data
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState('')
  const [saving, setSaving] = useState(false)

  const totalGastado = variables.reduce((s, g) => s + parseFloat(g.monto), 0)
  const restante = presupuestoV - totalGastado
  const pct = Math.min(totalGastado / presupuestoV, 1)

  const addGasto = async (e) => {
    e.preventDefault()
    if (!monto || parseFloat(monto) <= 0) return
    setSaving(true)
    const fecha = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
    await supabase.from('budget_entries').insert({
      user_name: user, type: 'variable',
      category: concepto.trim() || 'Sin concepto',
      amount: parseFloat(monto),
      description: fecha, month: 'variable'
    })
    setConcepto('')
    setMonto('')
    await onRefresh()
    setSaving(false)
  }

  const deleteGasto = async (id) => {
    await supabase.from('budget_entries').delete().eq('id', id)
    onRefresh()
  }

  return (
    <div>
      <h2 className="section-title">Gasto Variable</h2>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Restante</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: restante < 0 ? 'var(--red)' : 'var(--green)' }}>{restante.toFixed(2)}€ / {presupuestoV}€</span>
        </div>
        <div className="progress-bar-wrap" style={{ marginBottom: 0 }}>
          <div className={`progress-bar-fill ${pct > 0.8 ? 'warning' : ''}`} style={{ width: `${pct * 100}%` }} />
        </div>
      </div>

      <form className="form-card" onSubmit={addGasto}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>＋ Añadir gasto</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">¿En qué has gastado?</label>
            <input className="form-input" placeholder="Supermercado, café..." value={concepto} onChange={e => setConcepto(e.target.value)} />
          </div>
          <div className="form-group" style={{ maxWidth: 140 }}>
            <label className="form-label">Importe (€)</label>
            <input type="number" step="0.01" min="0" className="form-input" placeholder="0.00" value={monto} onChange={e => setMonto(e.target.value)} />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Restar dinero'}</button>
      </form>

      {variables.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">◎</div><p>No hay gastos variables este mes</p></div>
      ) : (
        <>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', marginBottom: 10 }}>Historial del mes</div>
          {variables.map(item => (
            <div key={item.id} className="list-item">
              <div className="list-item-left">
                <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 36 }}>{item.fecha}</span>
                <span className="list-item-name">{item.concepto}</span>
              </div>
              <div className="list-item-right">
                <span className="list-item-amount" style={{ color: 'var(--red)' }}>−{parseFloat(item.monto).toFixed(2)}€</span>
                <button className="delete-btn" onClick={() => deleteGasto(item.id)}>✕</button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
