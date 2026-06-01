import { createClient } from '@supabase/supabase-js'

// Remove espaços e barras extras que causam o erro "Invalid path"
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '')
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '❌ Variáveis do Supabase não encontradas.\n' +
    'Verifique se o arquivo .env existe na raiz do projeto com:\n' +
    'VITE_SUPABASE_URL=https://xxx.supabase.co\n' +
    'VITE_SUPABASE_ANON_KEY=sua_chave_aqui'
  )
}

if (!supabaseUrl.startsWith('https://')) {
  throw new Error(
    '❌ VITE_SUPABASE_URL inválida.\n' +
    'O valor deve começar com https:// — exemplo:\n' +
    'VITE_SUPABASE_URL=https://abcdefgh.supabase.co'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
