import React, { useState } from 'react'

export default function Patrimonio({ data, user, onRefresh, supabase }) {
  const { historico } = data
  const [mes, setMes] = useState('')
  const [patrimonio, setPatrimonio] = useState('')
  const [patrimonioInd, setPatrimonioInd] = useState('')
  const [ahorro, setAhorro] = useState('')
  const [nota, setNota] = useState('')
  
  // Estados para edición en tabla
  const [editingId, setEditingId] = useState(null)
  const [editingAhorro, setEditingAhorro] = useState('')
  const [editingNota, setEditingNota] = useState('')
  const [editingPatrimonio, setEditingPatrimonio] = useState('')
  const [editingPatrimonioInd, setEditingPatrimonioInd] = useState('')
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

  // Extraer el ahorro de forma segura
  const getAhorroValue = (item) => {
    let raw = item.ahorro !== undefined ? item.ahorro : item.description
    if (raw === null || raw === undefined) return 0
    if (typeof raw === 'string' && raw.includes('|')) {
      raw = raw.split('|')[0]
    }
    const num = parseFloat(String(raw).replace(',', '.'))
    return isNaN(num) ? 0 : num
  }

  // Extraer patrimonio conjunto e individual de forma compatible
  const parsePatrimonioValues = (item) => {
    // Si viene en el objeto directamente o en amount
    let rawAmount = item.patrimonio !== undefined ? item.patrimonio : item.amount
    
    if (typeof rawAmount === 'string' && rawAmount.includes(':')) {
      const parts = rawAmount.split(':')
      const conj = parseFloat(parts[0].replace(',', '.')) || 0
      const ind = parseFloat(parts[1].replace(',', '.')) || 0
      return { patrimonioConjunto: conj, patrimonioIndividual: ind }
    }
    
    const conj = parseFloat(String(rawAmount || 0).replace(',', '.')) || 0
    // Si no existía previamente patrimonio individual, podemos tomar el atributo o dejar 0
    const ind = parseFloat(String(item.patrimonio_individual || 0).replace(',', '.')) || 0
    return { patrimonioConjunto: conj, patrimonioIndividual: ind }
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
    const finalPatrimonioConj = isNaN(patrimonioNum) ? 0 : patrimonioNum

    const patrimonioIndLimpio = String(patrimonioInd).replace(',', '.')
    const patrimonioIndNum = parseFloat(patrimonioIndLimpio)
    const finalPatrimonioInd = isNaN(patrimonioIndNum) ? 0 : patrimonioIndNum

    // Guardamos la nota unida al mes en 'category'
    const finalCategory = nota.trim() ? `${mes.trim()} | ${nota.trim()}` : mes.trim()

    // Para no romper la BD, guardamos ambos patrimonios en amount mediante formato 'conjunto:individual'
    const amountVal = `${finalPatrimonioConj}:${finalPatrimonioInd}`

    await supabase.from('budget_entries').insert({
      user_name: user, 
      type: 'historico',
      category: finalCategory, 
      amount: amountVal,
      description: String(finalAhorro), 
      month: 'historico'
    })
    
    setMes(''); setPatrimonio(''); setPatrimonioInd(''); setAhorro(''); setNota('')
    await onRefresh()
    setSaving(false)
  }

  const saveEdicion = async (item) => {
    setSaving(true)
    
    const ahorroLimpio = String(editingAhorro).replace(',', '.')
    const ahorroNum = parseFloat(ahorroLimpio)
    const finalAhorro = isNaN(ahorroNum) ? 0 : ahorroNum

    const patConjLimpio = String(editingPatrimonio).replace(',', '.')
    const patConjNum = parseFloat(patConjLimpio)
    const finalPatConj = isNaN(patConjNum) ? 0 : patConjNum

    const patIndLimpio = String(editingPatrimonioInd).replace(',', '.')
    const patIndNum = parseFloat(patIndLimpio)
    const finalPatInd = isNaN(patIndNum) ? 0 : patIndNum

    const { mesNombre } = parseCategoryAndNota(item.category || item.mes)
    const finalCategory = editingNota.trim() ? `${mesNombre} | ${editingNota.trim()}` : mesNombre
    const amountVal = `${finalPatConj}:${finalPatInd}`

    await supabase.from('budget_entries').update({
      category: finalCategory,
      amount: amountVal,
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
  const lastPatrimonio = last ? parsePatrimonioValues(last) : { patrimonioConjunto: 0, patrimonioIndividual: 0 }

  return (
    <div>
      <h2 className="section-title">Patrimonio</h2>
      {last && (
        <div className="metric-grid" style={{ marginBottom: 20 }}>
          <div className="metric-card">
            <div className="metric-label">Último patrimonio conjunto</div>
            <div className="metric-value accent">
              {lastPatrimonio.patrimonioConjunto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Último patrimonio individual</div>
            <div className="metric-value accent">
              {lastPatrimonio.patrimonioIndividual.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
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
          <div className="form-group" style={{ maxWidth: 110 }}>
            <label className="form-label">Mes / Año</label>
            <input className="form-input" placeholder="Jun 2025" value={mes} onChange={e => setMes(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Patrimonio conjunto (€)</label>
            <input type="text" className="form-input" placeholder="0.00" value={patrimonio} onChange={e => setPatrimonio(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Patrimonio ind. (€)</label>
            <input type="text" className="form-input" placeholder="0.00" value={patrimonioInd} onChange={e => setPatrimonioInd(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Mi ahorro ind. (€)</label>
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
          <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Mes', 'Patrimonio Conjunto', 'Patrimonio Ind.', 'Ahorro', 'Nota', ''].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historico.map(item => {
                const { mesNombre, notaGuardada } = parseCategoryAndNota(item.category || item.mes)
                const { patrimonioConjunto, patrimonioIndividual } = parsePatrimonioValues(item)
                const numAhorro = getAhorroValue(item)
                const isEditing = editingId === item.id

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 12px', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>{mesNombre}</td>
                    
                    {/* COLUMNA PATRIMONIO CONJUNTO */}
                    <td style={{ padding: '12px 12px', fontSize: 13, color: 'var(--accent2)', whiteSpace: 'nowrap' }}>
                      {isEditing ? (
                        <input 
                          type="text"
                          className="form-input" 
                          style={{ padding: '4px 6px', fontSize: 12, width: '90px' }} 
                          value={editingPatrimonio} 
                          onChange={e => setEditingPatrimonio(e.target.value)} 
                        />
                      ) : (
                        <span>{patrimonioConjunto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€</span>
                      )}
                    </td>

                    {/* COLUMNA PATRIMONIO INDIVIDUAL */}
                    <td style={{ padding: '12px 12px', fontSize: 13, color: 'var(--accent2)', whiteSpace: 'nowrap' }}>
                      {isEditing ? (
                        <input 
                          type="text"
                          className="form-input" 
                          style={{ padding: '4px 6px', fontSize: 12, width: '90px' }} 
                          value={editingPatrimonioInd} 
                          onChange={e => setEditingPatrimonioInd(e.target.value)} 
                        />
                      ) : (
                        <span>{patrimonioIndividual.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€</span>
                      )}
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
                    <td style={{ padding: '12px 12px', fontSize: 13, color: 'var(--text2)', minWidth: '140px' }}>
                      {isEditing ? (
                        <input 
                          className="form-input" 
                          style={{ padding: '4px 6px', fontSize: 12, minWidth: '100px' }} 
                          value={editingNota} 
                          onChange={e => setEditingNota(e.target.value)} 
                          placeholder="Escribe una nota..."
                        />
                      ) : (
                        <div 
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                          onClick={() => {
                            setEditingId(item.id)
                            setEditingPatrimonio(String(patrimonioConjunto))
                            setEditingPatrimonioInd(String(patrimonioIndividual))
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
