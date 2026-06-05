import React, { useState } from 'react'

export default function GastosFijos({ data, user, onRefresh, supabase }) {
  const { fijos } = data
  const [concepto, setConcepto] = useState('')
  const [importe, setImporte] = useState('')
  const [saving, setSaving] = useState(false)

  const togglePagado = async (item) => {
    const newPagado = !item.pagado
    const uid = item.uid || item.id?.toString()
    await supabase.from('budget_entries')
      .update({ description: `uid:${uid}|pagado:${newPagado}` })
      .eq('id', item.id)
    onRefresh()
  }

  const addFijo = async (e) => {
    e.preventDefault()
    if (!concepto.trim() || !importe) return
    setSaving(true)
    const uid = crypto.randomUUID()
    await supabase.from('budget_entries').insert({
      user_name: user, type: 'fijo',
      category: concepto.trim(),
      amount: parseFloat(importe),
      description: `uid:${uid}|pagado:False`,
      month: 'fijos'
    })
    setConcepto('')
    setImporte('')
    await onRefresh()
    setSaving(false)
  }

  const deleteFijo = async (id) => {
    await supabase.from('budget_entries').delete().eq('id', id)
    onRefresh()
  }

  const totalFijos = fijos.reduce((s, g) => s + parseFloat(g.importe), 0)
  const pagados = fijos.filter(g => g.pagado).length

  return (
    <div>
      <h2 className="section-title">Gastos Fijos</h2>
      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="metric-card">
          <div className="metric-label">Total</div>
          <div className="metric-value">{totalFijos.toFixed(2)}€</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Pagados</div>
          <div className="metric-value positive">{pagados}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Pendientes</div>
          <div className="metric-value">{fijos.length - pagados}</div>
        </div>
      </div>

      <form className="form-card" onSubmit={addFijo}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>＋ Añadir gasto fijo</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Concepto</label>
            <input className="form-input" placeholder="Alquiler, luz, seguro..." value={concepto} onChange={e => setConcepto(e.target.value)} />
          </div>
          <div className="form-group" style={{ maxWidth: 140 }}>
            <label className="form-label">Importe (€)</label>
            <input type="number" step="0.01" min="0" className="form-input" placeholder="0.00" value={importe} onChange={e => setImporte(e.target.value)} />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Añadiendo...' : 'Añadir'}</button>
      </form>

      {fijos.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">⬡</div><p>No hay gastos fijos todavía</p></div>
      ) : fijos.map(item => (
        <div key={item.id} className={`list-item ${item.pagado ? 'done' : ''}`}>
          <div className="list-item-left">
            <div className={`checkbox-custom ${item.pagado ? 'checked' : ''}`} onClick={() => togglePagado(item)} />
            <span className={`list-item-name ${item.pagado ? 'done-text' : ''}`}>{item.concepto}</span>
          </div>
          <div className="list-item-right">
            <span className="list-item-amount">{parseFloat(item.importe).toFixed(2)}€</span>
            <button className="delete-btn" onClick={() => deleteFijo(item.id)}>✕</button>
          </div>
        </div>
      ))}
    </div>
  )
}
