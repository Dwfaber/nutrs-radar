export interface Ciclo {
  id: number
  solicitacao_compra_id: number
  filial_id: number
  supervisora_id: number | null
  solicitacao_tipo_id: number | null
  semana_de: string
  semana_ate: string
  data_criacao: string | null
  prazo_entrega: string | null
  total_planejado: number
  total_realizado: number
  total_extras: number
  custo_planejado_total: number
  custo_realizado_total: number
  saldo_real_total: number
  em_criacao: boolean
  cancelado: boolean
  enviado_em: string | null
  concluido_em: string | null
  synced_at: string
}

export interface Diario {
  id: number
  solicitacao_compra_data_id: number
  solicitacao_compra_id: number
  data: string
  custo_referencia: number
  planejado_quantidade: number
  planejado_total: number
  realizado_quantidade: number
  realizado_diferenca: number
  eficiencia: number
  custo_realizado: number
}

export interface Metrica {
  id: number
  solicitacao_compra_id: number
  filial_id: number
  semana_de: string
  semana_ate: string
  total_planejado: number
  total_realizado: number
  total_extras: number
  eficiencia_producao: number
  custo_planejado: number
  custo_realizado: number
  custo_por_refeicao_plan: number
  custo_por_refeicao_real: number
  variacao_custo: number
  total_acrescimos: number
  valor_acrescimos: number
  taxa_acrescimo: number
  trend_direction: 'improving' | 'stable' | 'declining' | null
  calculated_at: string
}

export interface Acrescimo {
  id: number
  acrescimo_id: number
  acrescimo_detalhe_id: number
  solicitacao_compra_id: number
  filial_id: number
  motivo: string | null
  descricao: string | null
  valor_total_acrescimo: number
  detalhe_valor_total: number
  data_solicitacao: string | null
  aprovado_em: string | null
  cancelado_em: string | null
}

export interface CicloComMetrica extends Ciclo {
  metrica?: Metrica
  status: 'planejamento' | 'em_andamento' | 'concluido' | 'cancelado'
}

export interface KPIData {
  totalCiclos: number
  ciclosAtivos: number
  totalRefeicoesPlanejadas: number
  totalRefeicoesRealizadas: number
  eficienciaMedia: number
  custoMedioRefeicao: number
  totalAcrescimos: number
  valorAcrescimos: number
}
