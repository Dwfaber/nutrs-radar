import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Nomes das tabelas com prefixo
export const TABLES = {
  CICLOS: 'rd-ciclos',
  DIARIOS: 'rd-diarios',
  SOLICITACAO_ITENS: 'rd-solicitacao-itens',
  ACRESCIMOS: 'rd-acrescimos',
  PEDIDOS_COMPRA: 'rd-pedidos-compra',
  PEDIDOS_COMPRA_ITENS: 'rd-pedidos-compra-itens',
  DUPLICATAS: 'rd-duplicatas',
  METRICAS: 'rd-metricas',
} as const
