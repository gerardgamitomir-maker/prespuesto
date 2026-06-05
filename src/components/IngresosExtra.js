import React, { useState } from 'react'

export default function IngresosExtra({ data, user, onRefresh, supabase }) {
  const { ingresos } = data
  const [concepto, setConcepto] = useState('')
  const [importe, setImporte] = useState('')
  const [saving, setSaving] = useState(false)

  const totalIngresos = ingresos.reduce((s, g) => s + parseFloat(g.importe), 0)
  const cobrados = ingresos.filter(g => g.cobrado).length

  const toggleCobrado = async (item) => {
    await supabase.from('budget_entries').update({ description: String(!item.cobrado) }).eq('id', item.id)
    onRefresh()
  }

  const addIngreso = async (e) => {
    e.preventDefault()
    if (!concepto.trim() || !importe) return
    setSaving(true)
    await supabase.from('budget_entries').insert({
      user_name: user, type: 'ingreso_extra',
      category: concepto.trim(), amount: parseFloat(importe),
      description: 'False', month: 'ingresos_extra'
    })
    setConcepto('')
    setImporte('')
    await onRefresh()
    setSaving(false)
  }

  const deleteIngreso = async (id) => {
    await supabase.from('budget_entries').delete().eq('id', id)
    onRefresh()
  }

  return (
    <div>
      <h2 className="section-title">Ingresos Extra</h2>
      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="metric-card"><div className="metric-label">Total</div><div className="metric-value positive">{totalIngresos.toFixed(2)}€</div></div>
        <div className="metric-card"><div className="metric-label">Cobrados</div><div className="metric-value positive">{cobrados}</div></div>
        <div className="metric-card"><div className="metric-label">Pendientes</div><div className="metric-value">{ingresos.length - cobrados}</div></div>
      </div>

      <form className="form-card" onSubmit={addIngreso}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>＋ Añadir ingreso</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Concepto</label>
            <input className="form-input" placeholder="Freelance, venta..." value={concepto} onChange={e => setConcepto(e.target.value)} />
          </div>
          <div className="form-group" style={{ maxWidth: 140 }}>
            <label className="form-label">Importe (€)</label>
            <input type="number" step="0.01" min="0" className="form-input" placeholder="0.00" value={importe} onChange={e => setImporte(e.target.value)} />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Añadiendo...' : 'Añadir'}</button>
      </form>

      {ingresos.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">◈</div><p>No hay ingresos extra este mes</p></div>
      ) : ingresos.map(item => (
        <div key={item.id} className={`list-item ${item.cobrado ? 'done' : ''}`}>
          <div className="list-item-left">
            <div className={`checkbox-custom ${item.cobrado ? 'checked' : ''}`} onClick={() => toggleCobrado(item)} />
            <span className={`list-item-name ${item.cobrado ? 'done-text' : ''}`}>{item.concepto}</span>
          </div>
          <div className="list-item-right">
            <span className="list-item-amount" style={{ color: 'var(--green)' }}>+{parseFloat(item.importe).toFixed(2)}€</span>
            <button className="delete-btn" onClick={() => deleteIngreso(item.id)}>✕</button>
          </div>
        </div>
      ))}
    </div>
  )
}
