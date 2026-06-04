import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null) // 'operador', 'administrativo', 'gestor'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) carregarPerfil(session.user.id)
      else setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        setLoading(true) // mantém loading enquanto perfil não chegou
        carregarPerfil(session.user.id)
      } else {
        setPerfil(null)
        setLoading(false)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function carregarPerfil(userId) {
    const { data } = await supabase
      .from('usuarios')
      .select('perfil, empresa_id')
      .eq('id', userId)
      .single()

    setPerfil(data?.perfil ?? null)
    setLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return { user, perfil, loading, logout }
}
