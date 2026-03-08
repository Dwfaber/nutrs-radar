import { useState, useMemo } from 'react'
import { format, parseISO, differenceInDays, addDays, isToday, isWeekend } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CicloComMetrica, Diario, Acrescimo } from '@/types'
import { 
  X, 
  ArrowLeft,
  FileEdit, 
  ShoppingCart, 
  Package, 
  Utensils, 
  FileCheck,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react'

interface GanttViewProps {
  ciclo: CicloComMetrica
  diarios: Diario[]
  acrescimos: Acrescimo[]
  onClose: () => void
}

type PhaseStatus = 'completed' | 'in-progress' | 'pending'

interface GanttPhase {
  id: string
  name: string
  description: string
  icon: React.ElementType
  startDay: number
  endDay: number
  status: PhaseStatus
  progress: number
  subtasks: {
    name: string
    startDay: number
    endDay: number
    status: PhaseStatus
    progress: number
  }[]
}

const phaseConfig = [
  { id: 'planning', name: 'Planejamento', description: 'Definição de cardápio e quantidades', icon: FileEdit, color: 'bg-purple-500' },
  { id: 'shopping', name: 'Compras', description: 'Cotação e pedidos de compra', icon: ShoppingCart, color: 'bg-blue-500' },
  { id: 'prep', name: 'Preparação', description: 'Recebimento e pré-preparo', icon: Package, color: 'bg-cyan-500' },
  { id: 'production', name: 'Produção', description: 'Execução das refeições', icon: Utensils, color: 'bg-green-500' },
  { id: 'closing', name: 'Fechamento', description: 'Consolidação e relatório', icon: FileCheck, color: 'bg-orange-500' },
]

function getStatusIcon(status: PhaseStatus) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />
    case 'in-progress':
      return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />
    default:
      return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
  }
}

export function GanttView({ ciclo, diarios: _diarios, acrescimos, onClose }: GanttViewProps) {
  const [activeView, setActiveView] = useState<'gantt' | 'list'>('gantt')
  
  const semanaInicio = parseISO(ciclo.semana_de)
  const semanaFim = parseISO(ciclo.semana_ate)
  const totalDias = differenceInDays(semanaFim, semanaInicio) + 1
  const hoje = new Date()
  
  const diasPassados = Math.max(0, Math.min(totalDias, differenceInDays(hoje, semanaInicio)))
  const progressoGeral = Math.round((diasPassados / totalDias) * 100)

  const dias = useMemo(() => {
    const result = []
    for (let i = 0; i < totalDias; i++) {
      const dia = addDays(semanaInicio, i)
      result.push({
        date: dia,
        dayName: format(dia, 'EEE', { locale: ptBR }),
        dayNumber: format(dia, 'd'),
        isToday: isToday(dia),
        isWeekend: isWeekend(dia)
      })
    }
    return result
  }, [semanaInicio, totalDias])

  const phases: GanttPhase[] = useMemo(() => {
    const emAndamento = ciclo.status === 'em_andamento'
    const concluido = ciclo.status === 'concluido'
    const enviado = !!ciclo.enviado_em

    return [
      {
        id: 'planning',
        name: 'Planejamento',
        description: 'Definição de cardápio e quantidades',
        icon: FileEdit,
        startDay: 0,
        endDay: 1,
        status: enviado || emAndamento || concluido ? 'completed' : 'in-progress',
        progress: enviado || emAndamento || concluido ? 100 : 50,
        subtasks: [
          { name: 'Definir cardápio', startDay: 0, endDay: 0.5, status: enviado ? 'completed' : 'in-progress', progress: enviado ? 100 : 70 },
          { name: 'Calcular quantidades', startDay: 0.3, endDay: 0.8, status: enviado ? 'completed' : 'in-progress', progress: enviado ? 100 : 50 },
          { name: 'Enviar solicitação', startDay: 0.7, endDay: 1, status: enviado ? 'completed' : 'pending', progress: enviado ? 100 : 0 },
        ]
      },
      {
        id: 'shopping',
        name: 'Compras',
        description: 'Cotação e pedidos de compra',
        icon: ShoppingCart,
        startDay: 1,
        endDay: 2.5,
        status: concluido ? 'completed' : emAndamento && progressoGeral >= 20 ? 'in-progress' : enviado ? 'in-progress' : 'pending',
        progress: concluido ? 100 : emAndamento ? Math.min(100, Math.max(0, (progressoGeral - 15) * 3)) : 0,
        subtasks: [
          { name: 'Cotação fornecedores', startDay: 1, endDay: 1.5, status: concluido || (emAndamento && progressoGeral >= 25) ? 'completed' : emAndamento && progressoGeral >= 15 ? 'in-progress' : 'pending', progress: concluido ? 100 : 0 },
          { name: 'Aprovação de preços', startDay: 1.3, endDay: 2, status: concluido || (emAndamento && progressoGeral >= 30) ? 'completed' : 'pending', progress: concluido ? 100 : 0 },
          { name: 'Emissão de pedidos', startDay: 1.8, endDay: 2.5, status: concluido || (emAndamento && progressoGeral >= 35) ? 'completed' : 'pending', progress: concluido ? 100 : 0 },
        ]
      },
      {
        id: 'prep',
        name: 'Preparação',
        description: 'Recebimento e pré-preparo',
        icon: Package,
        startDay: 2,
        endDay: 3.5,
        status: concluido ? 'completed' : emAndamento && progressoGeral >= 40 ? 'in-progress' : 'pending',
        progress: concluido ? 100 : emAndamento && progressoGeral >= 40 ? Math.min(100, (progressoGeral - 40) * 4) : 0,
        subtasks: [
          { name: 'Receber mercadorias', startDay: 2, endDay: 3, status: concluido || (emAndamento && progressoGeral >= 50) ? 'completed' : emAndamento && progressoGeral >= 40 ? 'in-progress' : 'pending', progress: concluido ? 100 : 0 },
          { name: 'Conferência de NF', startDay: 2.5, endDay: 3.2, status: concluido || (emAndamento && progressoGeral >= 55) ? 'completed' : 'pending', progress: concluido ? 100 : 0 },
          { name: 'Pré-preparo', startDay: 2.8, endDay: 3.5, status: concluido || (emAndamento && progressoGeral >= 60) ? 'completed' : 'pending', progress: concluido ? 100 : 0 },
        ]
      },
      {
        id: 'production',
        name: 'Produção',
        description: 'Execução das refeições',
        icon: Utensils,
        startDay: 3,
        endDay: 6,
        status: concluido ? 'completed' : emAndamento && progressoGeral >= 50 ? 'in-progress' : 'pending',
        progress: concluido ? 100 : emAndamento && progressoGeral >= 50 ? Math.min(100, (progressoGeral - 50) * 2.5) : 0,
        subtasks: [
          { name: 'Café da manhã', startDay: 3, endDay: 6, status: concluido ? 'completed' : emAndamento && progressoGeral >= 55 ? 'in-progress' : 'pending', progress: concluido ? 100 : Math.round((ciclo.total_realizado / Math.max(1, ciclo.total_planejado)) * 100) },
          { name: 'Almoço', startDay: 3, endDay: 6, status: concluido ? 'completed' : emAndamento && progressoGeral >= 55 ? 'in-progress' : 'pending', progress: concluido ? 100 : Math.round((ciclo.total_realizado / Math.max(1, ciclo.total_planejado)) * 100) },
          { name: 'Jantar', startDay: 3, endDay: 6, status: concluido ? 'completed' : emAndamento && progressoGeral >= 55 ? 'in-progress' : 'pending', progress: concluido ? 100 : Math.round((ciclo.total_realizado / Math.max(1, ciclo.total_planejado)) * 100) },
        ]
      },
      {
        id: 'closing',
        name: 'Fechamento',
        description: 'Consolidação e relatório',
        icon: FileCheck,
        startDay: 6,
        endDay: 7,
        status: concluido ? 'completed' : emAndamento && progressoGeral >= 85 ? 'in-progress' : 'pending',
        progress: concluido ? 100 : 0,
        subtasks: [
          { name: 'Consolidar dados', startDay: 6, endDay: 6.5, status: concluido ? 'completed' : 'pending', progress: concluido ? 100 : 0 },
          { name: 'Gerar relatório', startDay: 6.3, endDay: 7, status: concluido ? 'completed' : 'pending', progress: concluido ? 100 : 0 },
        ]
      }
    ]
  }, [ciclo, progressoGeral])

  const dayWidth = 100

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-5">
        <div className="flex items-start justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center hover:border-green-500 hover:text-green-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                Ciclo #{ciclo.solicitacao_compra_id}
                <span className={`
                  inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium
                  ${ciclo.status === 'concluido' ? 'bg-green-100 text-green-700' :
                    ciclo.status === 'em_andamento' ? 'bg-blue-100 text-blue-700' :
                    ciclo.status === 'cancelado' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'}
                `}>
                  {ciclo.status === 'em_andamento' && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                  {ciclo.status === 'concluido' ? 'Concluído' :
                   ciclo.status === 'em_andamento' ? 'Em Andamento' :
                   ciclo.status === 'cancelado' ? 'Cancelado' : 'Planejamento'}
                </span>
              </h1>
              <p className="text-gray-500 mt-1">
                {format(semanaInicio, "dd 'de' MMMM", { locale: ptBR })} - {format(semanaFim, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                <span className="mx-2">•</span>
                Filial {ciclo.filial_id}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Planejado</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{ciclo.total_planejado}</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Realizado</div>
              <div className="text-2xl font-bold text-green-600 mt-1">{ciclo.total_realizado}</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Extras</div>
              <div className="text-2xl font-bold text-orange-600 mt-1">{ciclo.total_extras}</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Eficiência</div>
              <div className={`text-2xl font-bold mt-1 ${
                (ciclo.metrica?.eficiencia_producao || 0) >= 95 ? 'text-green-600' :
                (ciclo.metrica?.eficiencia_producao || 0) >= 85 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {ciclo.metrica?.eficiencia_producao?.toFixed(1) || 0}%
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Acréscimos</div>
              <div className="text-2xl font-bold text-orange-600 mt-1">{acrescimos.length}</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progresso do Ciclo</span>
              <span className="text-sm font-semibold text-green-600">{progressoGeral}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                style={{ width: `${progressoGeral}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>{format(semanaInicio, 'dd/MM')}</span>
              <span>{format(semanaFim, 'dd/MM')}</span>
            </div>
          </div>

          {/* View Toggles */}
          <div className="bg-white rounded-xl shadow-sm mb-6">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-800">Cronograma de Atividades</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveView('gantt')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === 'gantt' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Gantt
                </button>
                <button
                  onClick={() => setActiveView('list')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === 'list' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Lista
                </button>
              </div>
            </div>

            {/* Gantt Content */}
            <div className="p-5 overflow-x-auto">
              {activeView === 'gantt' ? (
                <div className="min-w-[900px]">
                  {/* Timeline Header */}
                  <div className="flex ml-[280px] border-b border-gray-200 pb-2 mb-4">
                    {dias.map((dia, i) => (
                      <div 
                        key={i}
                        className={`
                          flex-shrink-0 text-center
                          ${dia.isToday ? 'text-green-600 font-semibold' : 'text-gray-600'}
                          ${dia.isWeekend ? 'text-gray-400' : ''}
                        `}
                        style={{ width: dayWidth }}
                      >
                        <div className="text-[10px] uppercase">{dia.dayName}</div>
                        <div className={`
                          text-lg font-semibold
                          ${dia.isToday 
                            ? 'bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto' 
                            : dia.isWeekend ? 'text-gray-400' : 'text-gray-700'
                          }
                        `}>
                          {dia.dayNumber}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Gantt Rows */}
                  <div className="space-y-1 relative">
                    {dias.findIndex(d => d.isToday) >= 0 && (
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-10"
                        style={{ left: `${280 + (dias.findIndex(d => d.isToday) * dayWidth) + (dayWidth / 2)}px` }}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
                          Hoje
                        </div>
                      </div>
                    )}

                    {phases.map((phase) => {
                      const config = phaseConfig.find(p => p.id === phase.id)!
                      const Icon = config.icon

                      return (
                        <div key={phase.id}>
                          <div className="flex items-center h-14 hover:bg-gray-50 rounded-lg group">
                            <div className="w-[280px] flex-shrink-0 flex items-center gap-3 px-3">
                              <div className={`w-9 h-9 rounded-lg ${config.color} flex items-center justify-center`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 text-sm">{phase.name}</div>
                                <div className="text-xs text-gray-500 truncate">{phase.description}</div>
                              </div>
                              {getStatusIcon(phase.status)}
                            </div>

                            <div className="flex-1 relative h-10">
                              <div className="absolute inset-0 flex">
                                {dias.map((dia, i) => (
                                  <div 
                                    key={i}
                                    className={`flex-shrink-0 border-l border-gray-100 h-full ${dia.isWeekend ? 'bg-gray-50' : ''}`}
                                    style={{ width: dayWidth }}
                                  />
                                ))}
                              </div>

                              <div 
                                className={`
                                  absolute top-1 h-8 rounded-lg ${config.color} 
                                  flex items-center justify-center text-white text-xs font-medium
                                  transition-all duration-300 overflow-hidden
                                `}
                                style={{
                                  left: phase.startDay * dayWidth,
                                  width: (phase.endDay - phase.startDay) * dayWidth - 4
                                }}
                              >
                                {phase.status === 'in-progress' && (
                                  <div 
                                    className="absolute inset-0 bg-white/30"
                                    style={{ width: `${phase.progress}%` }}
                                  />
                                )}
                                <span className="relative z-10">
                                  {phase.status === 'completed' ? '✓ Concluído' : 
                                   phase.status === 'in-progress' ? `${phase.progress}%` : ''}
                                </span>
                              </div>
                            </div>
                          </div>

                          {phase.subtasks.map((subtask, i) => (
                            <div key={i} className="flex items-center h-10 hover:bg-gray-50/50">
                              <div className="w-[280px] flex-shrink-0 flex items-center gap-3 px-3 pl-12">
                                <div className="text-gray-400">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 5l7 7-7 7"/>
                                  </svg>
                                </div>
                                <span className="text-sm text-gray-600">{subtask.name}</span>
                                <div className="ml-auto">{getStatusIcon(subtask.status)}</div>
                              </div>

                              <div className="flex-1 relative h-6">
                                <div className="absolute inset-0 flex">
                                  {dias.map((dia, j) => (
                                    <div 
                                      key={j}
                                      className={`flex-shrink-0 border-l border-gray-50 h-full ${dia.isWeekend ? 'bg-gray-50/50' : ''}`}
                                      style={{ width: dayWidth }}
                                    />
                                  ))}
                                </div>

                                <div 
                                  className={`
                                    absolute top-1 h-4 rounded
                                    ${subtask.status === 'completed' ? 'bg-green-400' :
                                      subtask.status === 'in-progress' ? 'bg-blue-400' : 'bg-gray-300'}
                                    transition-all duration-300 overflow-hidden
                                  `}
                                  style={{
                                    left: subtask.startDay * dayWidth,
                                    width: (subtask.endDay - subtask.startDay) * dayWidth - 2
                                  }}
                                >
                                  {subtask.status === 'in-progress' && (
                                    <div 
                                      className="absolute inset-0 bg-white/40"
                                      style={{ width: `${subtask.progress}%` }}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {phases.map((phase) => {
                    const config = phaseConfig.find(p => p.id === phase.id)!
                    const Icon = config.icon

                    return (
                      <div key={phase.id} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{phase.name}</h4>
                            <p className="text-sm text-gray-500">{phase.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(phase.status)}
                            <span className={`text-sm font-medium ${
                              phase.status === 'completed' ? 'text-green-600' :
                              phase.status === 'in-progress' ? 'text-blue-600' : 'text-gray-400'
                            }`}>
                              {phase.progress}%
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2 ml-12">
                          {phase.subtasks.map((subtask, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                              <span className="text-sm text-gray-700">{subtask.name}</span>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(subtask.status)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Acréscimos Alert */}
          {acrescimos.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-3">
              <div className="flex items-center gap-2 text-orange-700">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">{acrescimos.length} acréscimo(s)</span>
                <span className="text-sm">
                  - Total: R$ {acrescimos.reduce((acc, a) => acc + a.detalhe_valor_total, 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}