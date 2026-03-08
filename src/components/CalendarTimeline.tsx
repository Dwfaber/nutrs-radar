import { useMemo, useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  format, 
  parseISO, 
  startOfWeek, 
  addDays, 
  addWeeks,
  subWeeks,
  differenceInDays,
  isToday,
  isWeekend
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CicloComMetrica } from '@/types'
import { 
  ChevronLeft, 
  ChevronRight,
  FileEdit, 
  ShoppingCart, 
  Package, 
  Utensils, 
  FileCheck,
  ZoomIn,
  ZoomOut,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  Circle
} from 'lucide-react'

interface CalendarTimelineProps {
  ciclos: CicloComMetrica[]
  onSelectCiclo?: (ciclo: CicloComMetrica) => void
}

type PhaseStatus = 'completed' | 'in-progress' | 'pending'

interface Phase {
  id: string
  name: string
  status: PhaseStatus
  icon: React.ElementType
  description: string
}

// Paleta de cores para filiais (20 cores distintas)
const FILIAL_COLORS = [
  { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', light: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600', light: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-violet-500', hover: 'hover:bg-violet-600', light: 'bg-violet-100', text: 'text-violet-700' },
  { bg: 'bg-amber-500', hover: 'hover:bg-amber-600', light: 'bg-amber-100', text: 'text-amber-700' },
  { bg: 'bg-rose-500', hover: 'hover:bg-rose-600', light: 'bg-rose-100', text: 'text-rose-700' },
  { bg: 'bg-cyan-500', hover: 'hover:bg-cyan-600', light: 'bg-cyan-100', text: 'text-cyan-700' },
  { bg: 'bg-orange-500', hover: 'hover:bg-orange-600', light: 'bg-orange-100', text: 'text-orange-700' },
  { bg: 'bg-teal-500', hover: 'hover:bg-teal-600', light: 'bg-teal-100', text: 'text-teal-700' },
  { bg: 'bg-indigo-500', hover: 'hover:bg-indigo-600', light: 'bg-indigo-100', text: 'text-indigo-700' },
  { bg: 'bg-pink-500', hover: 'hover:bg-pink-600', light: 'bg-pink-100', text: 'text-pink-700' },
  { bg: 'bg-lime-500', hover: 'hover:bg-lime-600', light: 'bg-lime-100', text: 'text-lime-700' },
  { bg: 'bg-fuchsia-500', hover: 'hover:bg-fuchsia-600', light: 'bg-fuchsia-100', text: 'text-fuchsia-700' },
  { bg: 'bg-sky-500', hover: 'hover:bg-sky-600', light: 'bg-sky-100', text: 'text-sky-700' },
  { bg: 'bg-red-500', hover: 'hover:bg-red-600', light: 'bg-red-100', text: 'text-red-700' },
  { bg: 'bg-green-500', hover: 'hover:bg-green-600', light: 'bg-green-100', text: 'text-green-700' },
  { bg: 'bg-purple-500', hover: 'hover:bg-purple-600', light: 'bg-purple-100', text: 'text-purple-700' },
  { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', light: 'bg-yellow-100', text: 'text-yellow-700' },
  { bg: 'bg-slate-500', hover: 'hover:bg-slate-600', light: 'bg-slate-100', text: 'text-slate-700' },
  { bg: 'bg-stone-500', hover: 'hover:bg-stone-600', light: 'bg-stone-100', text: 'text-stone-700' },
  { bg: 'bg-zinc-500', hover: 'hover:bg-zinc-600', light: 'bg-zinc-100', text: 'text-zinc-700' },
]

// Mapa de cores por filial (persistente)
const filialColorMap = new Map<number, typeof FILIAL_COLORS[0]>()

// Obter cor para uma filial (consistente)
function getFilialColor(filialId: number, filialIndex: number) {
  if (!filialColorMap.has(filialId)) {
    filialColorMap.set(filialId, FILIAL_COLORS[filialIndex % FILIAL_COLORS.length])
  }
  return filialColorMap.get(filialId)!
}

// Calcula o status das fases do ciclo
function getCicloPhases(ciclo: CicloComMetrica): Phase[] {
  const hoje = new Date()
  const semanaInicio = parseISO(ciclo.semana_de)
  const semanaFim = parseISO(ciclo.semana_ate)
  const diasPassados = Math.max(0, differenceInDays(hoje, semanaInicio))
  const totalDias = differenceInDays(semanaFim, semanaInicio) + 1
  const progressoGeral = Math.min(100, Math.round((diasPassados / totalDias) * 100))

  const enviado = !!ciclo.enviado_em
  const concluido = !!ciclo.concluido_em || ciclo.status === 'concluido'
  const emAndamento = ciclo.status === 'em_andamento'
  const cancelado = ciclo.cancelado

  const basePhases = [
    { id: 'solicitacao', name: 'Solicitação', icon: FileEdit, description: 'Definição de cardápio e quantidades' },
    { id: 'pedido', name: 'Pedido', icon: ShoppingCart, description: 'Cotação e pedidos de compra' },
    { id: 'recebimento', name: 'Recebimento', icon: Package, description: 'Recebimento de mercadorias' },
    { id: 'producao', name: 'Produção', icon: Utensils, description: 'Execução das refeições' },
    { id: 'fechamento', name: 'Fechamento', icon: FileCheck, description: 'Consolidação e relatório' },
  ]

  if (cancelado || (!enviado && !emAndamento && !concluido)) {
    return basePhases.map((p, i) => ({
      ...p,
      status: (i === 0 && enviado) ? 'completed' : (i === 0 ? 'in-progress' : 'pending') as PhaseStatus
    }))
  }

  if (concluido) {
    return basePhases.map(p => ({ ...p, status: 'completed' as PhaseStatus }))
  }

  // Em andamento - calcular baseado no progresso
  const faseAtual = Math.floor((progressoGeral / 100) * 5)
  
  return basePhases.map((p, i) => ({
    ...p,
    status: (i < faseAtual ? 'completed' : i === faseAtual ? 'in-progress' : 'pending') as PhaseStatus
  }))
}

// Ícone de status para o tooltip
function PhaseStatusIcon({ status }: { status: PhaseStatus }) {
  if (status === 'completed') return <CheckCircle2 className="w-4 h-4 text-green-500" />
  if (status === 'in-progress') return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />
  return <Circle className="w-4 h-4 text-gray-300" />
}

// Mini pipeline com ícones dentro da barra
function MiniPipeline({ phases }: { phases: Phase[] }) {
  const [hoveredPhase, setHoveredPhase] = useState<Phase | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const handleMouseEnter = (e: React.MouseEvent, phase: Phase) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top })
    setHoveredPhase(phase)
  }

  return (
    <div className="flex items-center gap-0.5 relative">
      {phases.map((phase, i) => {
        const Icon = phase.icon
        return (
          <div key={phase.id} className="flex items-center">
            <div 
              className={`
                w-5 h-5 rounded flex items-center justify-center cursor-pointer
                transition-all duration-150
                ${phase.status === 'completed' ? 'bg-white/30' :
                  phase.status === 'in-progress' ? 'bg-white/50 animate-pulse' :
                  'bg-white/10'}
                hover:bg-white/40 hover:scale-110
              `}
              onMouseEnter={(e) => handleMouseEnter(e, phase)}
              onMouseLeave={() => setHoveredPhase(null)}
              onClick={(e) => e.stopPropagation()}
            >
              <Icon className={`w-3 h-3 ${
                phase.status === 'completed' ? 'text-white' :
                phase.status === 'in-progress' ? 'text-white' :
                'text-white/50'
              }`} />
            </div>
            {i < phases.length - 1 && (
              <div className={`w-1 h-0.5 ${
                phase.status === 'completed' ? 'bg-white/50' : 'bg-white/20'
              }`} />
            )}
          </div>
        )
      })}

      {/* Tooltip da fase */}
      {hoveredPhase && (
        <div 
          className="fixed z-[100] pointer-events-none"
          style={{ 
            left: tooltipPos.x, 
            top: tooltipPos.y - 8,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl min-w-[180px]">
            <div className="flex items-center gap-2 mb-1">
              <PhaseStatusIcon status={hoveredPhase.status} />
              <span className="font-semibold">{hoveredPhase.name}</span>
            </div>
            <p className="text-gray-300 text-[10px]">{hoveredPhase.description}</p>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-700">
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                hoveredPhase.status === 'completed' ? 'bg-green-500/30 text-green-300' :
                hoveredPhase.status === 'in-progress' ? 'bg-blue-500/30 text-blue-300' :
                'bg-gray-500/30 text-gray-400'
              }`}>
                {hoveredPhase.status === 'completed' ? 'Concluído' :
                 hoveredPhase.status === 'in-progress' ? 'Em Andamento' : 'Pendente'}
              </span>
            </div>
            {/* Arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  )
}

export function CalendarTimeline({ ciclos }: CalendarTimelineProps) {
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [baseDate, setBaseDate] = useState(() => {
  const hoje = new Date()
  return startOfWeek(subWeeks(hoje, 1), { weekStartsOn: 1 })
})
  const [weeksToShow, setWeeksToShow] = useState(4)
  const [hoveredCiclo, setHoveredCiclo] = useState<number | null>(null)

  const dayWidth = 45
  const filialLabelWidth = 140
  const rowHeight = 52

  // Gerar dias do calendário
  const dias = useMemo(() => {
    const result = []
    const totalDays = weeksToShow * 7
    for (let i = 0; i < totalDays; i++) {
      const dia = addDays(baseDate, i)
      result.push({
        date: dia,
        dayName: format(dia, 'EEE', { locale: ptBR }),
        dayNumber: format(dia, 'd'),
        monthName: format(dia, 'MMM', { locale: ptBR }),
        isToday: isToday(dia),
        isWeekend: isWeekend(dia),
        isFirstOfWeek: dia.getDay() === 1,
        isFirstOfMonth: dia.getDate() === 1
      })
    }
    return result
  }, [baseDate, weeksToShow])

  // Agrupar ciclos por filial
  const filiais = useMemo(() => {
    const map = new Map<number, CicloComMetrica[]>()
    
    ciclos.forEach(ciclo => {
      const existing = map.get(ciclo.filial_id) || []
      existing.push(ciclo)
      map.set(ciclo.filial_id, existing)
    })

    // Ordenar filiais por ID
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([filialId, filialCiclos]) => ({
        id: filialId,
        ciclos: filialCiclos.sort((a, b) => 
          new Date(a.semana_de).getTime() - new Date(b.semana_de).getTime()
        )
      }))
  }, [ciclos])

  // Calcular posição e largura de um ciclo
  const getCicloPosition = (ciclo: CicloComMetrica) => {
    const inicio = parseISO(ciclo.semana_de)
    const fim = parseISO(ciclo.semana_ate)
    
    const startOffset = differenceInDays(inicio, baseDate)
    const duration = differenceInDays(fim, inicio) + 1

    return {
      left: Math.max(0, startOffset * dayWidth),
      width: Math.max(dayWidth, duration * dayWidth - 4),
      isVisible: startOffset + duration > 0 && startOffset < weeksToShow * 7
    }
  }

  // Scroll para hoje
  const scrollToToday = () => {
    const hoje = new Date()
    setBaseDate(startOfWeek(subWeeks(hoje, 1), { weekStartsOn: 1 }))
  }

  // Navegação
  const goToPrevious = () => setBaseDate(prev => subWeeks(prev, weeksToShow))
  const goToNext = () => setBaseDate(prev => addWeeks(prev, weeksToShow))

  // Centralizar na data atual ao montar
  useEffect(() => {
    scrollToToday()
  }, [])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header com controles */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h2 className="text-base font-semibold text-gray-800">Calendário de Ciclos</h2>
          <span className="text-sm text-gray-500">
            {filiais.length} filiais • {ciclos.length} ciclos
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom */}
          <div className="flex items-center gap-1 mr-4">
            <button 
              onClick={() => setWeeksToShow(w => Math.max(2, w - 1))}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-500 w-20 text-center">{weeksToShow} semanas</span>
            <button 
              onClick={() => setWeeksToShow(w => Math.min(8, w + 1))}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>

          {/* Navegação */}
          <button 
            onClick={goToPrevious}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={scrollToToday}
            className="px-3 py-1.5 text-sm font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            Hoje
          </button>
          <button 
            onClick={goToNext}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendário */}
      <div className="overflow-x-auto" ref={scrollRef}>
        <div style={{ minWidth: filialLabelWidth + (dias.length * dayWidth) }}>
          
          {/* Header do calendário - Meses */}
          <div className="flex border-b border-gray-100 bg-gray-50">
            <div style={{ width: filialLabelWidth }} className="flex-shrink-0" />
            <div className="flex">
              {dias.map((dia, i) => (
                dia.isFirstOfMonth || i === 0 ? (
                  <div 
                    key={`month-${i}`}
                    className="text-xs font-semibold text-gray-600 uppercase tracking-wide py-1"
                    style={{ 
                      width: dayWidth,
                      position: 'relative'
                    }}
                  >
                    {format(dia.date, 'MMMM yyyy', { locale: ptBR })}
                  </div>
                ) : <div key={`month-${i}`} style={{ width: dayWidth }} />
              ))}
            </div>
          </div>

          {/* Header do calendário - Dias */}
          <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10">
            <div 
              style={{ width: filialLabelWidth }} 
              className="flex-shrink-0 px-3 py-2 bg-gray-50 border-r border-gray-200 flex items-center gap-2"
            >
              <Building2 className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-semibold text-gray-600 uppercase">Filial</span>
            </div>
            <div className="flex">
              {dias.map((dia, i) => (
                <div 
                  key={i}
                  className={`
                    flex flex-col items-center justify-center py-2 border-r border-gray-100
                    ${dia.isToday ? 'bg-green-50' : dia.isWeekend ? 'bg-gray-50' : 'bg-white'}
                    ${dia.isFirstOfWeek ? 'border-l-2 border-l-gray-300' : ''}
                  `}
                  style={{ width: dayWidth }}
                >
                  <span className={`text-[10px] uppercase ${
                    dia.isToday ? 'text-green-600 font-semibold' : 
                    dia.isWeekend ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {dia.dayName}
                  </span>
                  <span className={`
                    text-sm font-semibold
                    ${dia.isToday 
                      ? 'bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center' 
                      : dia.isWeekend ? 'text-gray-400' : 'text-gray-700'
                    }
                  `}>
                    {dia.dayNumber}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Linhas das filiais */}
          <div>
            {filiais.map((filial, filialIndex) => {
              const filialColor = getFilialColor(filial.id, filialIndex)
              
              return (
              <div 
                key={filial.id} 
                className="flex border-b border-gray-100 hover:bg-gray-50/50"
                style={{ height: rowHeight }}
              >
                {/* Label da filial */}
                <div 
                  style={{ width: filialLabelWidth }} 
                  className="flex-shrink-0 px-3 flex items-center border-r border-gray-200 bg-white sticky left-0 z-10"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${filialColor.light} flex items-center justify-center`}>
                      <span className={`text-xs font-bold ${filialColor.text}`}>{filial.id}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">Filial {filial.id}</div>
                      <div className="text-xs text-gray-400">{filial.ciclos.length} ciclo(s)</div>
                    </div>
                  </div>
                </div>

                {/* Track com ciclos */}
                <div className="relative flex-1" style={{ height: rowHeight }}>
                  {/* Grid de dias */}
                  <div className="absolute inset-0 flex">
                    {dias.map((dia, i) => (
                      <div 
                        key={i}
                        className={`
                          border-r border-gray-50 h-full
                          ${dia.isToday ? 'bg-green-50/50' : dia.isWeekend ? 'bg-gray-50/50' : ''}
                          ${dia.isFirstOfWeek ? 'border-l border-l-gray-200' : ''}
                        `}
                        style={{ width: dayWidth }}
                      />
                    ))}
                  </div>

                  {/* Barras dos ciclos */}
                  {filial.ciclos.map((ciclo) => {
                    const pos = getCicloPosition(ciclo)
                    if (!pos.isVisible) return null

                    const phases = getCicloPhases(ciclo)
                    const isHovered = hoveredCiclo === ciclo.id
                    const isCancelado = ciclo.cancelado

                    return (
                      <div
                        key={ciclo.id}
                        onClick={() => navigate(`/ciclo/${ciclo.solicitacao_compra_id}`)}
                        onMouseEnter={() => setHoveredCiclo(ciclo.id)}
                        onMouseLeave={() => setHoveredCiclo(null)}
                        className={`
                          absolute top-2 h-9 rounded-lg cursor-pointer
                          ${isCancelado ? 'bg-red-400 hover:bg-red-500' : `${filialColor.bg} ${filialColor.hover}`}
                          transition-all duration-150 shadow-sm
                          ${isHovered ? 'shadow-lg scale-[1.02] z-20' : 'z-10'}
                          flex items-center justify-between px-2 overflow-hidden
                        `}
                        style={{
                          left: pos.left,
                          width: pos.width,
                        }}
                      >
                        {/* Info do ciclo */}
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-bold text-white/90 whitespace-nowrap">
                            #{ciclo.solicitacao_compra_id}
                          </span>
                          {pos.width > 150 && (
                            <MiniPipeline phases={phases} />
                          )}
                        </div>

                        {/* Eficiência */}
                        {pos.width > 80 && ciclo.metrica && (
                          <span className={`
                            text-[10px] font-bold px-1.5 py-0.5 rounded
                            ${ciclo.metrica.eficiencia_producao >= 95 
                              ? 'bg-white/30 text-white' 
                              : ciclo.metrica.eficiencia_producao >= 85
                              ? 'bg-yellow-300/40 text-white'
                              : 'bg-red-300/40 text-white'
                            }
                          `}>
                            {ciclo.metrica.eficiencia_producao.toFixed(0)}%
                          </span>
                        )}

                        {/* Tooltip ao hover */}
                        {isHovered && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
                            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                              <div className="font-semibold">Ciclo #{ciclo.solicitacao_compra_id}</div>
                              <div className="text-gray-300 mt-1">
                                {format(parseISO(ciclo.semana_de), "dd/MM")} - {format(parseISO(ciclo.semana_ate), "dd/MM")}
                              </div>
                              <div className="flex gap-3 mt-1 text-gray-300">
                                <span>Plan: {ciclo.total_planejado}</span>
                                <span>Real: {ciclo.total_realizado}</span>
                              </div>
                              <div className="text-[10px] text-green-400 mt-1">Clique para ver detalhes →</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              )
            })}
          </div>

          {/* Legenda */}
          <div className="flex items-center justify-center gap-6 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span className="text-xs text-gray-600">Concluído</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500" />
              <span className="text-xs text-gray-600">Em Andamento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-400" />
              <span className="text-xs text-gray-600">Planejamento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-400" />
              <span className="text-xs text-gray-600">Cancelado</span>
            </div>
            <div className="flex items-center gap-1 ml-4 text-xs text-gray-500">
              <span>Pipeline:</span>
              <div className="flex items-center gap-0.5">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                <div className="w-1 h-0.5 bg-gray-300" />
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <div className="w-1 h-0.5 bg-gray-200" />
                <div className="w-2 h-2 rounded-full bg-gray-200" />
              </div>
              <span className="ml-1">(● concluído, ○ pendente)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}