import { useState, useEffect } from 'react'
import { supabase, TABLES } from '@/lib/supabase'
import { KPIData } from '@/types'

export function useKPIs() {
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchKPIs() {
      try {
        setLoading(true)

        // Total de ciclos
        const { count: totalCiclos } = await supabase
          .from(TABLES.CICLOS)
          .select('*', { count: 'exact', head: true })

        // Ciclos ativos (não cancelados e não concluídos)
        const { count: ciclosAtivos } = await supabase
          .from(TABLES.CICLOS)
          .select('*', { count: 'exact', head: true })
          .eq('cancelado', false)
          .is('concluido_em', null)

        // Buscar diários (dados reais de planejado/realizado)
        const { data: diarios } = await supabase
          .from(TABLES.DIARIOS)
          .select('planejado_quantidade, realizado_quantidade, custo_referencia, eficiencia')

        // Acréscimos
        const { data: acrescimos } = await supabase
          .from(TABLES.ACRESCIMOS)
          .select('detalhe_valor_total')

        // Calcular totais a partir dos diários
        const totalPlanejado = diarios?.reduce((acc, d) => acc + (d.planejado_quantidade || 0), 0) || 0
        const totalRealizado = diarios?.reduce((acc, d) => acc + (d.realizado_quantidade || 0), 0) || 0
        
        // Eficiência média (dos diários que tem eficiência > 0)
        const diariosComEficiencia = diarios?.filter(d => d.eficiencia && d.eficiencia > 0) || []
        const eficienciaMedia = diariosComEficiencia.length > 0
          ? diariosComEficiencia.reduce((acc, d) => acc + (d.eficiencia || 0), 0) / diariosComEficiencia.length
          : totalPlanejado > 0 ? (totalRealizado / totalPlanejado) * 100 : 0

        // Custo médio por refeição (média dos custos de referência)
        const diariosComCusto = diarios?.filter(d => d.custo_referencia && d.custo_referencia > 0) || []
        const custoMedio = diariosComCusto.length > 0
          ? diariosComCusto.reduce((acc, d) => acc + (d.custo_referencia || 0), 0) / diariosComCusto.length
          : 0

        const totalAcrescimos = acrescimos?.length || 0
        const valorAcrescimos = acrescimos?.reduce((acc, a) => acc + (a.detalhe_valor_total || 0), 0) || 0

        setKpis({
          totalCiclos: totalCiclos || 0,
          ciclosAtivos: ciclosAtivos || 0,
          totalRefeicoesPlanejadas: totalPlanejado,
          totalRefeicoesRealizadas: totalRealizado,
          eficienciaMedia: Math.round(eficienciaMedia * 10) / 10,
          custoMedioRefeicao: Math.round(custoMedio * 100) / 100,
          totalAcrescimos,
          valorAcrescimos
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar KPIs')
      } finally {
        setLoading(false)
      }
    }

    fetchKPIs()
  }, [])

  return { kpis, loading, error }
}