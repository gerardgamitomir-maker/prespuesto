import React, { useState } from 'react'

export default function Patrimonio({ data, user, onRefresh, supabase }) {
  const { historico } = data
  const [mes, setMes] = useState('')
  const [patrimonio, setPatrimonio] = useState('')
  const [ahorro, setAhorro] = useState('')
  const [nota, setNota] = useState('')
  
  // Estados para edición en tabla
  const [editingId, setEditingId] = useState(null)
  const [editingAhorro, setEditingAhorro] = useState('')
  const [editingNota, setEditingNota] = useState('')
  const [saving, setSaving] = useState(false)

  // Extraer el nombre del mes y la nota guardada desde la columna category
  const parseCategoryAndNota = (categoryStr) => {
    if (!categoryStr) return { mesNombre: '', notaGuardada: '' }
    if (categoryStr.includes('|')) {
      const parts = categoryStr.split('|')
      return {
        mesNombre: parts[0].trim(),
        notaGuardada: parts.slice(1).join('|').trim()
      }
    }
    return { mesNombre: categoryStr, notaGuardada: '' }
  }

  // Extraer el ahorro de forma segura desde la propiedad
  const getAhorroValue = (item) => {
    let raw = item.ahorro !== undefined ? item.ahorro : item.description
    if (raw === null || raw === undefined) return 0
    if (typeof raw === 'string' && raw.includes('|')) {
      raw = raw.split('|')[0]
    }
    const num = parseFloat(String(raw).replace(',', '.'))
    return isNaN(num) ? 0 : num
  }

  const addRegistro = async (e) => {
    e.preventDefault()
    if (!mes.trim()) return
    setSaving(true)
    
    const ahorroLimpio = String(ahorro).replace(',', '.')
    const ahorroNum = parseFloat(ahorroLimpio)
    const finalAhorro = isNaN(ahorroNum) ? 0 : ahorroNum

    const patrimonioLimpio = String(patrimonio).replace(',', '.')
    const patrimonioNum = parseFloat(patrimonioLimpio)
    const finalPatrimonio = isNaN(patrimonioNum) ? 0 : patrimonioNum

    // Guardamos la nota unida al mes en 'category' para evitar que App.js la descarte
    const finalCategory = nota.trim() ? `${mes.trim()} | ${nota.trim()}` : mes.trim()

    await supabase.from('budget_entries').insert({
      user_name: user, 
      type: 'historico',
      category: finalCategory, 
      amount: finalPatrimonio,
      description: String(finalAhorro), 
      month: 'historico'
    })
    
    setMes(''); setPatrimonio(''); setAhorro(''); setNota('')
    await onRefresh()
    setSaving(false)
  }

  const saveEdicion = async (item) => {
    setSaving(true)
    
    const ahorroLimpio = String(editingAhorro).replace(',', '.')
    const ahorroNum = parseFloat(ahorroLimpio)
    const finalAhorro = isNaN(ahorroNum) ? 0 : ahorroNum

    const { mesNombre } = parseCategoryAndNota(item.category || item.mes)
    const finalCategory = editingNota.trim() ? `${mesNombre} | ${editingNota.trim()}` : mesNombre

    await supabase.from('budget_entries').update({
      category: finalCategory,
      description: String(finalAhorro)
    }).eq('id', item.id)
    
    setEditingId(null)
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
          <div className="metric-card">
            <div className="metric-label">Último patrimonio conjunto</div>
            <div className="metric-value accent">
              {parseFloat(last.patrimonio || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Último ahorro individual</div>
            <div className={`metric-value ${getAhorroValue(last) < 0 ? 'negative' : 'positive'}`}>
              {getAhorroValue(last).toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
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
            <input type="text" className="form-input" placeholder="0.00" value={patrimonio} onChange={e => setPatrimonio(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Mi ahorro individual (€)</label>
            <input type="text" className="form-input" placeholder="-100.00" value={ahorro} onChange={e => setAhorro(e.target.value)} />
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

      {/* TABLA DE REGISTROS */}
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
                const { mesNombre, notaGuardada } = parseCategoryAndNota(item.category || item.mes)
                const numAhorro = getAhorroValue(item)
                const isEditing = editingId === item.id

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 12px', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>{mesNombre}</td>
                    
                    <td style={{ padding: '12px 12px', fontSize: 13, color: 'var(--accent2)', whiteSpace: 'nowrap' }}>
                      {parseFloat(item.patrimonio || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                    </td>

                    {/* COLUMNA AHORRO */}
                    <td style={{ padding: '12px 12px', fontSize: 13, color: numAhorro < 0 ? 'var(--red)' : 'var(--green)', whiteSpace: 'nowrap' }}>
                      {isEditing ? (
                        <input 
                          type="text"
                          className="form-input" 
                          style={{ padding: '4px 6px', fontSize: 12, width: '90px' }} 
                          value={editingAhorro} 
                          onChange={e => setEditingAhorro(e.target.value)} 
                        />
                      ) : (
                        <span>{numAhorro.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€</span>
                      )}
                    </td>

                    {/* COLUMNA NOTA */}
                    <td style={{ padding: '12px 12px', fontSize: 13, color: 'var(--text2)', minWidth: '160px' }}>
                      {isEditing ? (
                        <input 
                          className="form-input" 
                          style={{ padding: '4px 6px', fontSize: 12, minWidth: '120px' }} 
                          value={editingNota} 
                          onChange={e => setEditingNota(e.target.value)} 
                          placeholder="Escribe una nota..."
                        />
                      ) : (
                        <div 
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                          onClick={() => {
                            setEditingId(item.id)
                            setEditingAhorro(String(numAhorro))
                            setEditingNota(notaGuardada)
                          }}
                        >
                          <span style={{ fontSize: 12 }}>{notaGuardada || <i style={{ color: 'var(--text3)' }}>+ Nota</i>}</span>
                          <span style={{ fontSize: 10, opacity: 0.5 }}>✏️</span>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '12px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {isEditing ? (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '4px 8px', fontSize: 12 }}
                          onClick={() => saveEdicion(item)}
                        >
                          ✓ Guardar
                        </button>
                      ) : (
                        <button className="delete-btn" style={{ padding: '6px 10px' }} onClick={() => deleteRegistro(item.id)}>✕</button>
                      )}
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
