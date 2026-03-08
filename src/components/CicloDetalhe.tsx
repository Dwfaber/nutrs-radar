import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CicloComMetrica, Diario, Acrescimo } from '@/types'
import { X, Calendar, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react'

interface CicloDetalheProps {
  ciclo: CicloComMetrica
  diarios: Diario[]
  acrescimos: Acrescimo[]
  onClose: () => void
}

export function CicloDetalhe({ ciclo, diarios, acrescimos, onClose }: CicloDetalheProps) {
  const diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  
  // Calcular max para escala do gráfico
  const maxRefeicoes = Math.max(
    ...diarios.map(d => Math.max(d.planejado_quantidade, d.realizado_quantidade)),
    1
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Ciclo #{ciclo.solicitacao_compra_id}
            </h2>
            <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
              <Calendar size={14} />
              {format(parseISO(ciclo.semana_de), "dd/MM/yyyy", { locale: ptBR })} - {format(parseISO(ciclo.semana_ate), "dd/MM/yyyy", { locale: ptBR })}
              <span className="mx-2">•</span>
              Filial {ciclo.filial_id}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-5" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {/* KPIs do Ciclo */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Planejado</p>
              <p className="text-2xl font-bold text-blue-700">{ciclo.total_planejado}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">Realizado</p>
              <p className="text-2xl font-bold text-green-700">{ciclo.total_realizado}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-orange-600 font-medium">Extras</p>
              <p className="text-2xl font-bold text-orange-700">{ciclo.total_extras}</p>
            </div>
            <div className={`rounded-lg p-4 ${
              ciclo.metrica && ciclo.metrica.eficiencia_producao >= 95 ? 'bg-green-50' :
              ciclo.metrica && ciclo.metrica.eficiencia_producao >= 85 ? 'bg-yellow-50' :
              'bg-red-50'
            }`}>
              <p className={`text-sm font-medium ${
                ciclo.metrica && ciclo.metrica.eficiencia_producao >= 95 ? 'text-green-600' :
                ciclo.metrica && ciclo.metrica.eficiencia_producao >= 85 ? 'text-yellow-600' :
                'text-red-600'
              }`}>Eficiência</p>
              <p className={`text-2xl font-bold ${
                ciclo.metrica && ciclo.metrica.eficiencia_producao >= 95 ? 'text-green-700' :
                ciclo.metrica && ciclo.metrica.eficiencia_producao >= 85 ? 'text-yellow-700' :
                'text-red-700'
              }`}>
                {ciclo.metrica ? `${ciclo.metrica.eficiencia_producao.toFixed(1)}%` : '-'}
              </p>
            </div>
          </div>

          {/* Gráfico de Barras Diário */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <TrendingUp size={16} />
              Produção Diária
            </h3>
            <div className="flex gap-3 items-end h-48">
              {diarios.map((diario, idx) => {
                const planejadoHeight = (diario.planejado_quantidade / maxRefeicoes) * 100
                const realizadoHeight = (diario.realizado_quantidade / maxRefeicoes) * 100
                
                return (
                  <div key={diario.id} className="flex-1 flex flex-col items-center">
                    <div className="flex gap-1 items-end h-40 w-full justify-center">
                      {/* Barra Planejado */}
                      <div 
                        className="w-5 bg-blue-300 rounded-t transition-all"
                        style={{ height: `${planejadoHeight}%` }}
                        title={`Planejado: ${diario.planejado_quantidade}`}
                      />
                      {/* Barra Realizado */}
                      <div 
                        className={`w-5 rounded-t transition-all ${
                          diario.realizado_quantidade >= diario.planejado_quantidade 
                            ? 'bg-green-500' 
                            : 'bg-orange-500'
                        }`}
                        style={{ height: `${realizadoHeight}%` }}
                        title={`Realizado: ${diario.realizado_quantidade}`}
                      />
                    </div>
                    <p className="text-xs font-medium text-gray-600 mt-2">
                      {diasSemana[idx] || format(parseISO(diario.data), 'EEE', { locale: ptBR })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(parseISO(diario.data), 'dd/MM')}
                    </p>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-6 justify-center mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-300 rounded" />
                <span className="text-xs text-gray-600">Planejado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-xs text-gray-600">Realizado (ok)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded" />
                <span className="text-xs text-gray-600">Realizado (abaixo)</span>
              </div>
            </div>
          </div>

          {/* Acréscimos */}
          {acrescimos.length > 0 && (
            <div className="bg-orange-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-orange-700 mb-4 flex items-center gap-2">
                <AlertTriangle size={16} />
                Acréscimos ({acrescimos.length})
              </h3>
              <div className="space-y-3">
                {acrescimos.map((acrescimo) => (
                  <div 
                    key={acrescimo.id}
                    className="bg-white rounded-lg p-4 border border-orange-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">
                          {acrescimo.motivo || 'Sem motivo informado'}
                        </p>
                        {acrescimo.descricao && (
                          <p className="text-sm text-gray-500 mt-1">{acrescimo.descricao}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600 flex items-center gap-1">
                          <DollarSign size={14} />
                          R$ {acrescimo.detalhe_valor_total.toFixed(2)}
                        </p>
                        {acrescimo.aprovado_em && (
                          <p className="text-xs text-gray-400 mt-1">
                            Aprovado em {format(parseISO(acrescimo.aprovado_em), "dd/MM HH:mm")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custos */}
          {ciclo.metrica && (
            <div className="bg-gray-50 rounded-xl p-5 mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <DollarSign size={16} />
                Análise de Custos
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Custo Planejado</p>
                  <p className="text-lg font-bold">R$ {ciclo.metrica.custo_planejado.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Custo Realizado</p>
                  <p className="text-lg font-bold">R$ {ciclo.metrica.custo_realizado.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Variação</p>
                  <p className={`text-lg font-bold ${
                    ciclo.metrica.variacao_custo <= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {ciclo.metrica.variacao_custo > 0 ? '+' : ''}{ciclo.metrica.variacao_custo.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
