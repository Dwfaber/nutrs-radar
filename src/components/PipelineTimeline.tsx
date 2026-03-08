import { format, parseISO, differenceInDays, isWithinInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CicloComMetrica } from '@/types'
import { 
  FileEdit, 
  ShoppingCart, 
  Package, 
  Utensils, 
  FileCheck,
  ChevronRight,
  Clock
} from 'lucide-react'

interface PipelineTimelineProps {
  ciclos: CicloComMetrica[]
  onSelectCiclo: (ciclo: CicloComMetrica) => void
}

type PhaseStatus = 'completed' | 'in-progress' | 'pending'

interface Phase {
  id: string
  name: string
  icon: React.ElementType
  status: PhaseStatus
  progress: number
}

function getCicloPhases(ciclo: CicloComMetrica): Phase[] {
  const hoje = new Date()
  const semanaInicio = parseISO(ciclo.semana_de)
  const semanaFim = parseISO(ciclo.semana_ate)
  const diasPassados = Math.max(0, differenceInDays(hoje, semanaInicio))
  const totalDias = differenceInDays(semanaFim, semanaInicio) + 1
  const progressoGeral = Math.min(100, Math.round((diasPassados / totalDias) * 100))

  // Determinar status de cada fase baseado no ciclo
  const enviado = !!ciclo.enviado_em
  const concluido = !!ciclo.concluido_em || ciclo.status === 'concluido'
  const emAndamento = ciclo.status === 'em_andamento'
  const cancelado = ciclo.cancelado

  if (cancelado) {
    return [
      { id: 'solicitacao', name: 'Solicitação', icon: FileEdit, status: 'completed', progress: 100 },
      { id: 'pedido', name: 'Pedido', icon: ShoppingCart, status: 'pending', progress: 0 },
      { id: 'recebimento', name: 'Recebimento', icon: Package, status: 'pending', progress: 0 },
      { id: 'producao', name: 'Produção', icon: Utensils, status: 'pending', progress: 0 },
      { id: 'fechamento', name: 'Fechamento', icon: FileCheck, status: 'pending', progress: 0 },
    ]
  }

  if (concluido) {
    return [
      { id: 'solicitacao', name: 'Solicitação', icon: FileEdit, status: 'completed', progress: 100 },
      { id: 'pedido', name: 'Pedido', icon: ShoppingCart, status: 'completed', progress: 100 },
      { id: 'recebimento', name: 'Recebimento', icon: Package, status: 'completed', progress: 100 },
      { id: 'producao', name: 'Produção', icon: Utensils, status: 'completed', progress: 100 },
      { id: 'fechamento', name: 'Fechamento', icon: FileCheck, status: 'completed', progress: 100 },
    ]
  }

  if (emAndamento) {
    // Calcular em qual fase estamos baseado no progresso
    const faseAtual = Math.floor((progressoGeral / 100) * 5)
    
    return [
      { id: 'solicitacao', name: 'Solicitação', icon: FileEdit, status: 'completed', progress: 100 },
      { id: 'pedido', name: 'Pedido', icon: ShoppingCart, status: faseAtual >= 1 ? 'completed' : 'in-progress', progress: faseAtual >= 1 ? 100 : Math.min(100, progressoGeral * 2) },
      { id: 'recebimento', name: 'Recebimento', icon: Package, status: faseAtual >= 2 ? 'completed' : faseAtual >= 1 ? 'in-progress' : 'pending', progress: faseAtual >= 2 ? 100 : faseAtual >= 1 ? Math.min(100, (progressoGeral - 20) * 2.5) : 0 },
      { id: 'producao', name: 'Produção', icon: Utensils, status: faseAtual >= 3 ? 'completed' : faseAtual >= 2 ? 'in-progress' : 'pending', progress: faseAtual >= 3 ? 100 : faseAtual >= 2 ? Math.min(100, (progressoGeral - 40) * 2.5) : 0 },
      { id: 'fechamento', name: 'Fechamento', icon: FileCheck, status: faseAtual >= 4 ? 'in-progress' : 'pending', progress: faseAtual >= 4 ? Math.min(100, (progressoGeral - 80) * 5) : 0 },
    ]
  }

  // Planejamento
  return [
    { id: 'solicitacao', name: 'Solicitação', icon: FileEdit, status: enviado ? 'completed' : 'in-progress', progress: enviado ? 100 : 50 },
    { id: 'pedido', name: 'Pedido', icon: ShoppingCart, status: 'pending', progress: 0 },
    { id: 'recebimento', name: 'Recebimento', icon: Package, status: 'pending', progress: 0 },
    { id: 'producao', name: 'Produção', icon: Utensils, status: 'pending', progress: 0 },
    { id: 'fechamento', name: 'Fechamento', icon: FileCheck, status: 'pending', progress: 0 },
  ]
}

const statusColors = {
  completed: {
    bg: 'bg-green-500',
    ring: 'ring-green-200',
    text: 'text-green-600',
    line: 'bg-green-500'
  },
  'in-progress': {
    bg: 'bg-blue-500',
    ring: 'ring-blue-200',
    text: 'text-blue-600',
    line: 'bg-blue-300'
  },
  pending: {
    bg: 'bg-gray-300',
    ring: 'ring-gray-100',
    text: 'text-gray-400',
    line: 'bg-gray-200'
  }
}

function PhaseSpot({ phase, isLast }: { phase: Phase; isLast: boolean }) {
  const colors = statusColors[phase.status]
  const Icon = phase.icon

  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center">
        <div 
          className={`
            w-10 h-10 rounded-full flex items-center justify-center
            ${colors.bg} ring-4 ${colors.ring}
            ${phase.status === 'in-progress' ? 'animate-pulse' : ''}
            transition-all duration-300
          `}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className={`text-xs font-medium mt-2 ${colors.text}`}>
          {phase.name}
        </span>
        {phase.status === 'in-progress' && (
          <span className="text-xs text-blue-500 font-semibold">
            {phase.progress}%
          </span>
        )}
      </div>
      {!isLast && (
        <div className={`w-8 h-1 ${colors.line} mx-1 mt-[-20px]`} />
      )}
    </div>
  )
}

function CicloCard({ ciclo, onClick }: { ciclo: CicloComMetrica; onClick: () => void }) {
  const phases = getCicloPhases(ciclo)
  const hoje = new Date()
  const semanaAtual = isWithinInterval(hoje, {
    start: parseISO(ciclo.semana_de),
    end: parseISO(ciclo.semana_ate)
  })

  const eficiencia = ciclo.metrica?.eficiencia_producao || 0

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-xl p-5 border-2 cursor-pointer
        transition-all duration-200 hover:shadow-lg hover:scale-[1.02]
        ${semanaAtual ? 'border-orange-400 ring-2 ring-orange-100' : 'border-gray-100'}
        ${ciclo.cancelado ? 'opacity-50' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">
              Ciclo #{ciclo.solicitacao_compra_id}
            </span>
            {semanaAtual && (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                Semana Atual
              </span>
            )}
            {ciclo.cancelado && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                Cancelado
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {format(parseISO(ciclo.semana_de), "dd/MM", { locale: ptBR })} - {format(parseISO(ciclo.semana_ate), "dd/MM", { locale: ptBR })}
            <span className="mx-1">•</span>
            Filial {ciclo.filial_id}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${
            eficiencia >= 95 ? 'text-green-600' :
            eficiencia >= 85 ? 'text-yellow-600' :
            eficiencia > 0 ? 'text-red-600' : 'text-gray-400'
          }`}>
            {eficiencia > 0 ? `${eficiencia.toFixed(0)}%` : '-'}
          </div>
          <div className="text-xs text-gray-400">Eficiência</div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="flex items-start justify-between px-2">
        {phases.map((phase, index) => (
          <PhaseSpot 
            key={phase.id} 
            phase={phase} 
            isLast={index === phases.length - 1} 
          />
        ))}
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-500">Plan:</span>
            <span className="font-semibold ml-1">{ciclo.total_planejado}</span>
          </div>
          <div>
            <span className="text-gray-500">Real:</span>
            <span className="font-semibold ml-1">{ciclo.total_realizado}</span>
          </div>
          <div>
            <span className="text-gray-500">Extras:</span>
            <span className="font-semibold ml-1 text-orange-600">{ciclo.total_extras}</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  )
}

export function PipelineTimeline({ ciclos, onSelectCiclo }: PipelineTimelineProps) {
  // Agrupar por status
  const ciclosAtivos = ciclos.filter(c => c.status === 'em_andamento')
  const ciclosPlanejamento = ciclos.filter(c => c.status === 'planejamento')
  const ciclosConcluidos = ciclos.filter(c => c.status === 'concluido').slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Ciclos em Andamento */}
      {ciclosAtivos.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Em Andamento
            <span className="text-sm font-normal text-gray-500">({ciclosAtivos.length})</span>
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {ciclosAtivos.map(ciclo => (
              <CicloCard 
                key={ciclo.id} 
                ciclo={ciclo} 
                onClick={() => onSelectCiclo(ciclo)} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Ciclos em Planejamento */}
      {ciclosPlanejamento.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            Em Planejamento
            <span className="text-sm font-normal text-gray-500">({ciclosPlanejamento.length})</span>
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ciclosPlanejamento.slice(0, 6).map(ciclo => (
              <CicloCard 
                key={ciclo.id} 
                ciclo={ciclo} 
                onClick={() => onSelectCiclo(ciclo)} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Últimos Concluídos */}
      {ciclosConcluidos.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Recentemente Concluídos
            <span className="text-sm font-normal text-gray-500">({ciclosConcluidos.length})</span>
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ciclosConcluidos.map(ciclo => (
              <CicloCard 
                key={ciclo.id} 
                ciclo={ciclo} 
                onClick={() => onSelectCiclo(ciclo)} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
