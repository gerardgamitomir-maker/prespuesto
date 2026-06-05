import React, { useState } from 'react'

export default function Dashboard({ data, user, onRefresh, supabase }) {
  const { fijos, variables, ingresos, sueldo, presupuestoV } = data
  const [editSueldo, setEditSueldo] = useState(sueldo)
  const [editPresupuesto, setEditPresupuesto] = useState(presupuestoV)
  const [saving, setSaving] = useState(false)

  const totalFijos = fijos.reduce((s, g) => s + parseFloat(g.importe), 0)
  const totalVariable = variables.reduce((s, g) => s + parseFloat(g.monto), 0)
  const totalIngresos = ingresos.reduce((s, g) => s + parseFloat(g.importe), 0)
  const restanteV = presupuestoV - totalVariable
  const dineroQueda = sueldo + totalIngresos - totalFijos - totalVariable
  const fijosPagados = fijos.filter(g => g.pagado).length

  const saveConfig = async () => {
    setSaving(true)
    await supabase.from('budget_entries').delete()
      .eq('user_name', user).eq('type', 'config')
    await supabase.from('budget_entries').insert({
      user_name: user, type: 'config', category: 'sueldo',
      amount: editSueldo, description: String(editPresupuesto), month: 'config'
    })
    await onRefresh()
    setSaving(false)
  }

  return (
    <div>
      <h2 className="section-title">Hola, {user} 👋</h2>
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-label">Sueldo neto</div>
          <div className="metric-value">{sueldo.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Ingresos extra</div>
          <div className="metric-value accent">{totalIngresos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total fijos</div>
          <div className="metric-value">{totalFijos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Sobre variable</div>
          <div className={`metric-value ${restanteV < 0 ? 'negative' : ''}`}>
            {restanteV.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
          </div>
        </div>
        <div className="metric-card" style={{ gridColumn: 'span 2' }}>
          <div className="metric-label">Dinero que queda</div>
          <div className={`metric-value ${dineroQueda >= 0 ? 'positive' : 'negative'}`} style={{ fontSize: 36 }}>
            {dineroQueda.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Gastos fijos pagados</span>
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>{fijosPagados} / {fijos.length}</span>
        </div>
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: fijos.length ? `${(fijosPagados / fijos.length) * 100}%` : '0%' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Gasto variable usado</span>
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>{totalVariable.toFixed(2)}€ / {presupuestoV}€</span>
        </div>
        <div className="progress-bar-wrap" style={{ marginBottom: 0 }}>
          <div
            className={`progress-bar-fill ${totalVariable / presupuestoV > 0.8 ? 'warning' : ''}`}
            style={{ width: `${Math.min((totalVariable / presupuestoV) * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className="form-card">
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          ⚙ Ajustes
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Sueldo neto mensual</label>
            <input type="number" className="form-input" value={editSueldo} onChange={e => setEditSueldo(parseFloat(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label className="form-label">Presupuesto variable</label>
            <input type="number" className="form-input" value={editPresupuesto} onChange={e => setEditPresupuesto(parseFloat(e.target.value) || 0)} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={saveConfig} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar ajustes'}
        </button>
      </div>
    </div>
  )
}
