import React, { useState } from 'react'

export default function Patrimonio({ data, user, onRefresh, supabase }) {
  const { historico } = data
  const [mes, setMes] = useState('')
  const [patrimonio, setPatrimonio] = useState('')
  const [ahorro, setAhorro] = useState('')
  const [nota, setNota] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingNota, setEditingNota] = useState('')
  const [saving, setSaving] = useState(false)

  const addRegistro = async (e) => {
    e.preventDefault()
    if (!mes.trim()) return
    setSaving(true)
    
    await supabase.from('budget_entries').insert({
      user_name: user, 
      type: 'historico',
      category: mes.trim(), 
      amount: parseFloat(patrimonio) || 0,
      description: JSON.stringify({
        ahorro: String(parseFloat(ahorro) || 0),
        nota: nota.trim()
      }), 
      month: 'historico'
    })
    
    setMes(''); setPatrimonio(''); setAhorro(''); setNota('')
    await onRefresh()
    setSaving(false)
  }

  const saveNotaExistente = async (id, ahorroActual) => {
    setSaving(true)
    await supabase.from('budget_entries').update({
      description: JSON.stringify({
        ahorro: String(ahorroActual || 0),
        nota: editingNota.trim()
      })
    }).eq('id', id)
    
    setEditingId(null)
    setEditingNota('')
    await onRefresh()
    setSaving(false)
  }

  const deleteRegistro = async (id) => {
    await supabase.from('budget_entries').delete().eq('id', id)
    onRefresh()
  }

  const parseDescription = (desc) => {
    try {
      const parsed = JSON.parse(desc)
      return {
        ahorro: parsed.ahorro || desc,
        nota: parsed.nota || ''
      }
    } catch (e) {
      return { ahorro: desc, nota: '' }
    }
  }

  const last = historico[historico.length - 1]

  return (
    <div>
      <h2 className="section-title">Patrimonio</h2>
      {last && (
        <div className="metric-grid" style={{ marginBottom: 20 }}>
          <div className="metric-card">
            <div className="metric-label">Último patrimonio conjunto</div>
            <div className="metric-value accent">
              {parseFloat(last.patrimonio).toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Último ahorro individual</div>
            <div className={`metric-value ${parseFloat(last.ahorro) < 0 ? 'negative' : 'positive'}`}>
              {parseFloat(last.ahorro).toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
            </div>
          </div>
        </div>
      )}

      {/* FORMULARIO DE NUEVO REGISTRO */}
      <form className="form-card" onSubmit={addRegistro}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>＋ Nuevo registro</div>
        <div className="form-row">
          <div className="form-group" style={{ maxWidth: 120 }}>
            <label className="form-label">Mes / Año</label>
            <input className="form-input" placeholder="Jun 2025" value={mes} onChange={e => setMes(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Patrimonio conjunto (€)</label>
            <input type="number" step="0.01" className="form-input" placeholder="0.00" value={patrimonio} onChange={e => setPatrimonio(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Mi ahorro individual (€)</label>
            <input type="number" step="0.01" className="form-input" placeholder="0.00" value={ahorro} onChange={e => setAhorro(e.target.value)} />
          </div>
        </div>
        
        <div className="form-group" style={{ marginTop: 10 }}>
          <label className="form-label">Nota / Observaciones (Opcional)</label>
          <input className="form-input" placeholder="Ej: Paga extra, bonus, viaje..." value={nota} onChange={e => setNota(e.target.value)} />
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: 14 }} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar registro'}
        </button>
      </form>

      {/* TABLA DE REGISTROS CON SCROLL HORIZONTAL PARA MÓVIL */}
      {historico.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">△</div><p>No hay registros todavía</p></div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Mes', 'Patrimonio', 'Ahorro', 'Nota', ''].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historico.map(item => {
                const { ahorro, nota: notaGuardada } = parseDescription(item.description || item.ahorro)
                const isEditing = editingId === item.id

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 12px', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>{item.mes}</td>
                    <td style={{ padding: '12px 12px', fontSize: 13, color: 'var(--accent2)', whiteSpace: 'nowrap' }}>
                      {parseFloat(item.patrimonio).toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                    </td>
                    <td style={{ padding: '12px 12px', fontSize: 13, color: parseFloat(ahorro) < 0 ? 'var(--red)' : 'var(--green)', whiteSpace: 'nowrap' }}>
                      {parseFloat(ahorro).toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                    </td>
                    
                    {/* EDICIÓN DE NOTA OPTIMIZADA PARA MÓVIL */}
                    <td style={{ padding: '12px 12px', fontSize: 13, color: 'var(--text2)', minWidth: '160px' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input 
                            className="form-input" 
                            style={{ padding: '6px 8px', fontSize: 12, minWidth: '100px' }} 
                            value={editingNota} 
                            onChange={e => setEditingNota(e.target.value)} 
                            placeholder="Nota..."
                          />
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '6px 10px', fontSize: 12, shrink: 0 }}
                            onClick={() => saveNotaExistente(item.id, ahorro)}
                          >
                            ✓
                          </button>
                        </div>
                      ) : (
                        <div 
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} 
                          onClick={() => { setEditingId(item.id); setEditingNota(notaGuardada); }}
                        >
                          <span style={{ fontSize: 12 }}>{notaGuardada || <i style={{ color: 'var(--text3)' }}>+ Nota</i>}</span>
                          <span style={{ fontSize: 10, opacity: 0.5 }}>✏️</span>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '12px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="delete-btn" style={{ padding: '6px 10px' }} onClick={() => deleteRegistro(item.id)}>✕</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
