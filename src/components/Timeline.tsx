import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CicloComMetrica } from '@/types'
import { ChevronRight } from 'lucide-react'

interface TimelineProps {
  ciclos: CicloComMetrica[]
  onSelectCiclo: (ciclo: CicloComMetrica) => void
  selectedCicloId?: number
}

const statusColors = {
  planejamento: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    dot: 'bg-gray-400',
    text: 'text-gray-600'
  },
  em_andamento: {
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    dot: 'bg-blue-500',
    text: 'text-blue-700'
  },
  concluido: {
    bg: 'bg-green-50',
    border: 'border-green-400',
    dot: 'bg-green-500',
    text: 'text-green-700'
  },
  cancelado: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    dot: 'bg-red-400',
    text: 'text-red-600'
  }
}

const statusLabels = {
  planejamento: 'Planejamento',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado'
}

export function Timeline({ ciclos, onSelectCiclo, selectedCicloId }: TimelineProps) {
  const hoje = new Date()
  const semanaAtual = {
    start: startOfWeek(hoje, { weekStartsOn: 1 }),
    end: endOfWeek(hoje, { weekStartsOn: 1 })
  }

  // Agrupar por filial_id
  const ciclosPorFilial = ciclos.reduce((acc, ciclo) => {
    const filialId = ciclo.filial_id
    if (!acc[filialId]) acc[filialId] = []
    acc[filialId].push(ciclo)
    return acc
  }, {} as Record<number, CicloComMetrica[]>)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">Timeline de Ciclos</h2>
        <p className="text-sm text-gray-500">Últimas semanas de produção</p>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-[800px] p-4">
          {Object.entries(ciclosPorFilial).slice(0, 10).map(([filialId, filialCiclos]) => (
            <div key={filialId} className="mb-6 last:mb-0">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Filial {filialId}
                </span>
                <span className="text-xs text-gray-400">
                  {filialCiclos.length} ciclos
                </span>
              </div>
              
              <div className="relative">
                {/* Linha horizontal */}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200" />
                
                {/* Ciclos */}
                <div className="relative flex gap-2 overflow-x-auto pb-2">
                  {filialCiclos.slice(0, 8).map((ciclo) => {
                    const colors = statusColors[ciclo.status]
                    const isSelected = selectedCicloId === ciclo.solicitacao_compra_id
                    const isSemanaAtual = isWithinInterval(parseISO(ciclo.semana_de), semanaAtual)
                    
                    return (
                      <button
                        key={ciclo.id}
                        onClick={() => onSelectCiclo(ciclo)}
                        className={`
                          relative flex-shrink-0 w-36 p-3 rounded-lg border-2 transition-all
                          ${colors.bg} ${colors.border}
                          ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500 scale-105' : 'hover:scale-102'}
                          ${isSemanaAtual ? 'ring-2 ring-orange-400' : ''}
                        `}
                      >
                        {/* Dot no topo */}
                        <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${colors.dot} border-2 border-white shadow-sm`} />
                        
                        {/* Indicador semana atual */}
                        {isSemanaAtual && (
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                            Semana Atual
                          </div>
                        )}
                        
                        <div className="text-left">
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            {format(parseISO(ciclo.semana_de), "dd/MM", { locale: ptBR })} - {format(parseISO(ciclo.semana_ate), "dd/MM", { locale: ptBR })}
                          </p>
                          <p className={`text-xs font-semibold ${colors.text} mb-2`}>
                            {statusLabels[ciclo.status]}
                          </p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Plan:</span>
                              <span className="font-medium">{ciclo.total_planejado}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Real:</span>
                              <span className="font-medium">{ciclo.total_realizado}</span>
                            </div>
                            {ciclo.metrica && (
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Efic:</span>
                                <span className={`font-medium ${
                                  ciclo.metrica.eficiencia_producao >= 95 ? 'text-green-600' :
                                  ciclo.metrica.eficiencia_producao >= 85 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {ciclo.metrica.eficiencia_producao.toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <ChevronRight className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
