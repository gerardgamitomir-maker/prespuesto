import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import Dashboard from './components/Dashboard'
import GastosFijos from './components/GastosFijos'
import GastoVariable from './components/GastoVariable'
import IngresosExtra from './components/IngresosExtra'
import Patrimonio from './components/Patrimonio'
import Libreta from './components/Libreta'
import './App.css'

const TABS = [
  { id: 'dashboard', label: 'Inicio', icon: '◈' },
  { id: 'fijos', label: 'Fijos', icon: '⬡' },
  { id: 'variable', label: 'Variable', icon: '◎' },
  { id: 'ingresos', label: 'Ingresos', icon: '◈' },
  { id: 'patrimonio', label: 'Patrimonio', icon: '△' },
  { id: 'libreta', label: 'Notas', icon: '◻' },
]

export default function App() {
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('dashboard')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async (u) => {
    if (!u) return
    setLoading(true)
    try {
      const { data: rows } = await supabase
        .from('budget_entries')
        .select('*')
        .eq('user_name', u)

      const fijos = (rows || [])
        .filter(r => r.type === 'fijo')
        .map(r => {
          const desc = r.description || ''
          let uid = r.id?.toString()
          let pagado = false
          if (desc.startsWith('uid:')) {
            const parts = desc.split('|')
            uid = parts[0].replace('uid:', '')
            pagado = parts[1]?.replace('pagado:', '') === 'True'
          } else {
            pagado = desc === 'True'
          }
          return { id: r.id, uid, concepto: r.category, importe: r.amount, pagado }
        })

      const variables = (rows || [])
        .filter(r => r.type === 'variable')
        .map(r => ({ id: r.id, fecha: r.description, concepto: r.category, monto: r.amount }))

      const historico = (rows || [])
        .filter(r => r.type === 'historico')
        .map(r => ({ id: r.id, mes: r.category, patrimonio: r.amount, ahorro: parseFloat(r.description) || 0 }))

      const ingresos = (rows || [])
        .filter(r => r.type === 'ingreso_extra')
        .map(r => ({ id: r.id, concepto: r.category, importe: r.amount, cobrado: r.description === 'True' }))

      const notaRow = (rows || []).find(r => r.type === 'nota')
      const nota = notaRow?.description || ''

      const configRow = (rows || []).find(r => r.type === 'config')
      const sueldo = configRow?.amount || 2000
      const presupuestoV = parseFloat(configRow?.description) || 250

      setData({ fijos, variables, historico, ingresos, nota, sueldo, presupuestoV })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) loadData(user)
  }, [user, loadData])

  if (!user) return <UserSelect onSelect={setUser} />

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <span className="brand-icon">◈</span>
            <span className="brand-name">Presupuesto</span>
          </div>
          <div className="header-user" onClick={() => setUser(null)}>
            <span className="user-avatar">{user[0]}</span>
            <span className="user-name">{user}</span>
            <span className="user-chevron">⌄</span>
          </div>
        </div>
      </header>

      <nav className="tab-nav">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>

      <main className="app-main">
        {loading && <div className="loading-bar" />}
        {data && (
          <>
            {tab === 'dashboard' && <Dashboard data={data} user={user} onRefresh={() => loadData(user)} supabase={supabase} />}
            {tab === 'fijos' && <GastosFijos data={data} user={user} onRefresh={() => loadData(user)} supabase={supabase} />}
            {tab === 'variable' && <GastoVariable data={data} user={user} onRefresh={() => loadData(user)} supabase={supabase} />}
            {tab === 'ingresos' && <IngresosExtra data={data} user={user} onRefresh={() => loadData(user)} supabase={supabase} />}
            {tab === 'patrimonio' && <Patrimonio data={data} user={user} onRefresh={() => loadData(user)} supabase={supabase} />}
            {tab === 'libreta' && <Libreta data={data} user={user} onRefresh={() => loadData(user)} supabase={supabase} />}
          </>
        )}
      </main>
    </div>
  )
}

function UserSelect({ onSelect }) {
  return (
    <div className="user-select">
      <div className="user-select-inner">
        <div className="user-select-brand">
          <span className="brand-icon-lg">◈</span>
          <h1>Presupuesto</h1>
          <p>¿Quién eres?</p>
        </div>
        <div className="user-select-btns">
          {['Gerard', 'Marina'].map(name => (
            <button key={name} className="user-select-btn" onClick={() => onSelect(name)}>
              <span className="user-select-avatar">{name[0]}</span>
              <span>{name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
