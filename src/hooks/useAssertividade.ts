import { useState, useEffect } from 'react'
import { supabase, TABLES } from '@/lib/supabase'

export interface AssertividadeData {
  // Taxa geral
  taxaAcerto: number // % de ciclos dentro de ±5%
  totalCiclosAnalisados: number
  ciclosAssertivos: number
  
  // Déficits (faltou)
  totalDeficits: number
  deficitMedio: number // % médio quando falta
  
  // Sobras (desperdício)
  totalSobras: number
  sobraMedio: number // % médio quando sobra
  custoDesperdicioEstimado: number
  
  // Por filial
  filiais: FilialAssertividade[]
  
  // Alertas
  alertas: Alerta[]
}

export interface FilialAssertividade {
  filialId: number
  totalCiclos: number
  ciclosAssertivos: number
  taxaAcerto: number
  deficits: number
  sobras: number
  variacaoMedia: number
  custoDesperdicioEstimado: number
}

export interface Alerta {
  tipo: 'ruptura' | 'desperdicio' | 'assertivo' | 'evento'
  filialId: number
  cicloId: number
  mensagem: string
  valor: number
  data: string
}

const MARGEM_ACERTO = 5 // ±5% é considerado assertivo
const CUSTO_REFEICAO_MEDIO = 12 // R$ para estimar desperdício

export function useAssertividade() {
  const [data, setData] = useState<AssertividadeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAssertividade() {
      try {
        setLoading(true)

        // Buscar ciclos não cancelados
        const { data: ciclos, error: ciclosError } = await supabase
          .from(TABLES.CICLOS)
          .select('*')
          .eq('cancelado', false)
          .order('semana_de', { ascending: false })

        if (ciclosError) throw ciclosError

        // Buscar diários (tem os dados reais de planejado/realizado)
        const { data: diarios, error: diariosError } = await supabase
          .from(TABLES.DIARIOS)
          .select('solicitacao_compra_id, planejado_quantidade, realizado_quantidade, custo_referencia')

        if (diariosError) throw diariosError

        // Agrupar diários por ciclo e calcular totais
        const metricasCalculadas = new Map<number, {
          total_planejado: number
          total_realizado: number
          custo_total: number
        }>()

        diarios?.forEach((d: any) => {
          const existing = metricasCalculadas.get(d.solicitacao_compra_id) || {
            total_planejado: 0,
            total_realizado: 0,
            custo_total: 0
          }
          existing.total_planejado += d.planejado_quantidade || 0
          existing.total_realizado += d.realizado_quantidade || 0
          existing.custo_total += (d.custo_referencia || 0) * (d.planejado_quantidade || 0)
          metricasCalculadas.set(d.solicitacao_compra_id, existing)
        })

        // Analisar cada ciclo
        const alertas: Alerta[] = []
        const filiaisMap = new Map<number, {
          ciclos: number
          assertivos: number
          deficits: number
          sobras: number
          variacoes: number[]
          desperdicio: number
        }>()

        let ciclosAssertivos = 0
        let totalDeficits = 0
        let totalSobras = 0
        let somaDeficit = 0
        let somaSobra = 0
        let custoDesperdicioTotal = 0
        let ciclosComDados = 0

        ciclos?.forEach((ciclo: any) => {
          const metrica = metricasCalculadas.get(ciclo.solicitacao_compra_id)
          if (!metrica || !metrica.total_planejado || metrica.total_planejado === 0) return

          ciclosComDados++
          
          const planejado = metrica.total_planejado
          const realizado = metrica.total_realizado
          const variacao = ((realizado - planejado) / planejado) * 100

          // Inicializar filial se não existir
          if (!filiaisMap.has(ciclo.filial_id)) {
            filiaisMap.set(ciclo.filial_id, {
              ciclos: 0,
              assertivos: 0,
              deficits: 0,
              sobras: 0,
              variacoes: [],
              desperdicio: 0
            })
          }
          const filialData = filiaisMap.get(ciclo.filial_id)!
          filialData.ciclos++
          filialData.variacoes.push(variacao)

          // Classificar
          if (Math.abs(variacao) <= MARGEM_ACERTO) {
            // Assertivo
            ciclosAssertivos++
            filialData.assertivos++
          } else if (variacao > MARGEM_ACERTO) {
            // Faltou (consumo > planejado) = DÉFICIT/RUPTURA
            totalDeficits++
            filialData.deficits++
            somaDeficit += variacao

            alertas.push({
              tipo: 'ruptura',
              filialId: ciclo.filial_id,
              cicloId: ciclo.solicitacao_compra_id,
              mensagem: `Déficit de ${variacao.toFixed(1)}% - faltaram ${Math.round(realizado - planejado)} refeições`,
              valor: variacao,
              data: ciclo.semana_de
            })
          } else {
            // Sobrou (consumo < planejado) = DESPERDÍCIO
            totalSobras++
            filialData.sobras++
            const sobraAbs = Math.abs(variacao)
            somaSobra += sobraAbs
            
            const refeicoesDesperdicadas = planejado - realizado
            const custoDesp = refeicoesDesperdicadas * CUSTO_REFEICAO_MEDIO
            custoDesperdicioTotal += custoDesp
            filialData.desperdicio += custoDesp

            if (sobraAbs > 10) {
              alertas.push({
                tipo: 'desperdicio',
                filialId: ciclo.filial_id,
                cicloId: ciclo.solicitacao_compra_id,
                mensagem: `Desperdício de ${sobraAbs.toFixed(1)}% - sobraram ${Math.round(planejado - realizado)} refeições`,
                valor: sobraAbs,
                data: ciclo.semana_de
              })
            }
          }
        })

        // Calcular dados por filial
        const filiais: FilialAssertividade[] = []
        filiaisMap.forEach((data, filialId) => {
          const variacaoMedia = data.variacoes.length > 0
            ? data.variacoes.reduce((a, b) => a + b, 0) / data.variacoes.length
            : 0

          filiais.push({
            filialId,
            totalCiclos: data.ciclos,
            ciclosAssertivos: data.assertivos,
            taxaAcerto: data.ciclos > 0 ? (data.assertivos / data.ciclos) * 100 : 0,
            deficits: data.deficits,
            sobras: data.sobras,
            variacaoMedia,
            custoDesperdicioEstimado: data.desperdicio
          })
        })

        // Ordenar filiais por taxa de acerto (decrescente)
        filiais.sort((a, b) => b.taxaAcerto - a.taxaAcerto)

        // Ordenar alertas por data (mais recentes primeiro)
        alertas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

        setData({
          taxaAcerto: ciclosComDados > 0 ? (ciclosAssertivos / ciclosComDados) * 100 : 0,
          totalCiclosAnalisados: ciclosComDados,
          ciclosAssertivos,
          totalDeficits,
          deficitMedio: totalDeficits > 0 ? somaDeficit / totalDeficits : 0,
          totalSobras,
          sobraMedio: totalSobras > 0 ? somaSobra / totalSobras : 0,
          custoDesperdicioEstimado: custoDesperdicioTotal,
          filiais,
          alertas: alertas.slice(0, 10) // Top 10 alertas
        })

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao calcular assertividade')
      } finally {
        setLoading(false)
      }
    }

    fetchAssertividade()
  }, [])

  return { data, loading, error }
}