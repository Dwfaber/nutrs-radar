import { useState, useEffect } from 'react'
import { supabase, TABLES } from '@/lib/supabase'
import { Ciclo, Metrica, CicloComMetrica } from '@/types'

function getCicloStatus(ciclo: Ciclo): CicloComMetrica['status'] {
  if (ciclo.cancelado) return 'cancelado'
  if (ciclo.concluido_em) return 'concluido'
  if (ciclo.enviado_em) return 'em_andamento'
  return 'planejamento'
}

// Calcula métricas a partir dos diários
function calcularMetricasDeDiarios(diarios: any[]): Metrica | undefined {
  if (!diarios || diarios.length === 0) return undefined

  const totalPlanejado = diarios.reduce((acc, d) => acc + (d.planejado_quantidade || 0), 0)
  const totalRealizado = diarios.reduce((acc, d) => acc + (d.realizado_quantidade || 0), 0)
  const custoTotal = diarios.reduce((acc, d) => acc + (d.custo_realizado || 0), 0)

  if (totalPlanejado === 0) return undefined

  const eficiencia = (totalRealizado / totalPlanejado) * 100

  return {
    id: 0,
    solicitacao_compra_id: diarios[0].solicitacao_compra_id,
    filial_id: diarios[0].filial_id || 0,
    semana_de: '',
    semana_ate: '',
    total_planejado: totalPlanejado,
    total_realizado: totalRealizado,
    total_extras: 0,
    eficiencia_producao: Math.round(eficiencia * 100) / 100,
    custo_planejado: 0,
    custo_realizado: custoTotal,
    custo_por_refeicao_plan: 0,
    custo_por_refeicao_real: totalRealizado > 0 ? custoTotal / totalRealizado : 0,
    variacao_custo: 0,
    total_acrescimos: 0,
    valor_acrescimos: 0,
    taxa_acrescimo: 0,
    trend_direction: null,
    calculated_at: new Date().toISOString()
  }
}

export function useCiclos(filialId?: number) {
  const [ciclos, setCiclos] = useState<CicloComMetrica[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCiclos() {
      try {
        setLoading(true)
        
        // Buscar ciclos
        let query = supabase
          .from(TABLES.CICLOS)
          .select('*')
          .order('semana_de', { ascending: false })
          .limit(50)
        
        if (filialId) {
          query = query.eq('filial_id', filialId)
        }

        const { data: ciclosData, error: ciclosError } = await query

        if (ciclosError) throw ciclosError

        // Buscar diários para calcular métricas
        const { data: diariosData, error: diariosError } = await supabase
          .from(TABLES.DIARIOS)
          .select('solicitacao_compra_id, planejado_quantidade, realizado_quantidade, custo_realizado')

        if (diariosError) throw diariosError

        // Agrupar diários por ciclo
        const diariosPorCiclo = new Map<number, any[]>()
        diariosData?.forEach((d: any) => {
          const existing = diariosPorCiclo.get(d.solicitacao_compra_id) || []
          existing.push(d)
          diariosPorCiclo.set(d.solicitacao_compra_id, existing)
        })

        // Calcular métricas para cada ciclo
        const metricasMap = new Map<number, Metrica>()
        diariosPorCiclo.forEach((diarios, solicitacaoCompraId) => {
          const metrica = calcularMetricasDeDiarios(diarios)
          if (metrica) {
            metricasMap.set(solicitacaoCompraId, metrica)
          }
        })

        const ciclosComMetricas: CicloComMetrica[] = (ciclosData || []).map((c: Ciclo) => ({
          ...c,
          metrica: metricasMap.get(c.solicitacao_compra_id),
          status: getCicloStatus(c)
        }))

        setCiclos(ciclosComMetricas)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar ciclos')
      } finally {
        setLoading(false)
      }
    }

    fetchCiclos()
  }, [filialId])

  return { ciclos, loading, error }
}

export function useCicloDetalhe(solicitacaoCompraId: number) {
  const [ciclo, setCiclo] = useState<CicloComMetrica | null>(null)
  const [diarios, setDiarios] = useState<any[]>([])
  const [acrescimos, setAcrescimos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDetalhe() {
      try {
        setLoading(true)

        // Ciclo
        const { data: cicloData, error: cicloError } = await supabase
          .from(TABLES.CICLOS)
          .select('*')
          .eq('solicitacao_compra_id', solicitacaoCompraId)
          .single()

        if (cicloError) throw cicloError

        // Diários
        const { data: diariosData, error: diariosError } = await supabase
          .from(TABLES.DIARIOS)
          .select('*')
          .eq('solicitacao_compra_id', solicitacaoCompraId)
          .order('data', { ascending: true })

        if (diariosError) throw diariosError

        // Calcular métrica a partir dos diários
        const metricaCalculada = calcularMetricasDeDiarios(diariosData || [])

        // Acréscimos
        const { data: acrescimosData, error: acrescimosError } = await supabase
          .from(TABLES.ACRESCIMOS)
          .select('*')
          .eq('solicitacao_compra_id', solicitacaoCompraId)

        if (acrescimosError) throw acrescimosError

        setCiclo({
          ...cicloData,
          metrica: metricaCalculada,
          status: getCicloStatus(cicloData)
        })
        setDiarios(diariosData || [])
        setAcrescimos(acrescimosData || [])

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes')
      } finally {
        setLoading(false)
      }
    }

    if (solicitacaoCompraId) {
      fetchDetalhe()
    }
  }, [solicitacaoCompraId])

  return { ciclo, diarios, acrescimos, loading, error }
}