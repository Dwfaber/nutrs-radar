import { useState } from 'react'
import { 
  BarChart3, 
  Utensils, 
  TrendingUp, 
  AlertCircle, 
  Activity,
  RefreshCw,
  Radar,
  Calendar,
  Target
} from 'lucide-react'
import { KPICard } from './components/KPICard'
import { CalendarTimeline } from './components/CalendarTimeline'
import { AssertividadeDashboard } from './components/AssertividadeDashboard'
import { useCiclos } from './hooks/useCiclos'
import { useKPIs } from './hooks/useKPIs'

type TabType = 'timeline' | 'assertividade'

function App() {
  const { ciclos, loading: loadingCiclos, error: errorCiclos } = useCiclos()
  const { kpis, loading: loadingKPIs } = useKPIs()
  const [activeTab, setActiveTab] = useState<TabType>('timeline')

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 p-2 rounded-lg">
                <Radar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">NUTRS Radar</h1>
                <p className="text-xs text-gray-500">Gestão de Ciclos de Produção</p>
              </div>
            </div>
            
            <button 
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw size={16} />
              Atualizar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading State */}
        {(loadingCiclos || loadingKPIs) && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-gray-500">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Carregando dados...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {errorCiclos && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              <span className="font-medium">Erro ao carregar dados:</span>
              <span>{errorCiclos}</span>
            </div>
          </div>
        )}

        {/* KPIs Grid */}
        {kpis && !loadingKPIs && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KPICard
              title="Total de Ciclos"
              value={kpis.totalCiclos}
              subtitle={`${kpis.ciclosAtivos} ativos`}
              icon={BarChart3}
              color="blue"
            />
            <KPICard
              title="Refeições Realizadas"
              value={kpis.totalRefeicoesRealizadas.toLocaleString('pt-BR')}
              subtitle={`de ${kpis.totalRefeicoesPlanejadas.toLocaleString('pt-BR')} planejadas`}
              icon={Utensils}
              color="green"
            />
            <KPICard
              title="Eficiência Média"
              value={`${kpis.eficienciaMedia}%`}
              icon={TrendingUp}
              color={kpis.eficienciaMedia >= 95 ? 'green' : kpis.eficienciaMedia >= 85 ? 'orange' : 'red'}
              trend={kpis.eficienciaMedia >= 95 ? 'up' : kpis.eficienciaMedia >= 85 ? 'neutral' : 'down'}
            />
            <KPICard
              title="Acréscimos"
              value={kpis.totalAcrescimos}
              subtitle={`R$ ${kpis.valorAcrescimos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={AlertCircle}
              color="orange"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all
              ${activeTab === 'timeline' 
                ? 'bg-green-600 text-white shadow-sm' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}
            `}
          >
            <Calendar className="w-4 h-4" />
            Timeline de Ciclos
          </button>
          <button
            onClick={() => setActiveTab('assertividade')}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all
              ${activeTab === 'assertividade' 
                ? 'bg-green-600 text-white shadow-sm' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}
            `}
          >
            <Target className="w-4 h-4" />
            Assertividade
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'timeline' && (
          <>
            {/* Calendar Timeline */}
            {!loadingCiclos && ciclos.length > 0 && (
              <CalendarTimeline ciclos={ciclos} />
            )}

            {/* Empty State */}
            {!loadingCiclos && ciclos.length === 0 && !errorCiclos && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum ciclo encontrado</h3>
                <p className="text-gray-500">Os dados ainda não foram sincronizados ou não há ciclos no período selecionado.</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'assertividade' && (
          <AssertividadeDashboard />
        )}
      </main>
    </div>
  )
}

export default App