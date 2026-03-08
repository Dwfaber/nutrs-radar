import { useAssertividade } from '@/hooks/useAssertividade'
import { Gauge } from './Gauge'
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronRight,
  Target,
  DollarSign,
  BarChart3
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function AssertividadeDashboard() {
  const { data, loading, error } = useAssertividade()

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-center gap-3 text-gray-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Calculando assertividade...</span>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
        <div className="flex items-center gap-2 text-red-700">
          <XCircle className="w-5 h-5" />
          <span>{error || 'Erro ao carregar dados'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-green-600" />
            Dashboard de Assertividade
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Análise de {data.totalCiclosAnalisados} ciclos • Margem de acerto: ±5%
          </p>
        </div>
      </div>

      {/* Gauge Principal + Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gauge Central */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center">
          <Gauge 
            value={data.taxaAcerto}
            label="Taxa de Acerto"
            sublabel={`${data.ciclosAssertivos} de ${data.totalCiclosAnalisados} ciclos`}
            size="lg"
            thresholds={{ danger: 70, warning: 85 }}
          />
        </div>

        {/* Cards de Métricas */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Déficits */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Déficits</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.totalDeficits}</div>
            <div className="text-xs text-gray-500 mt-1">
              Média: +{data.deficitMedio.toFixed(1)}%
            </div>
            <div className="mt-2 text-[10px] text-red-600 bg-red-50 px-2 py-1 rounded">
              Faltou refeição
            </div>
          </div>

          {/* Sobras */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Sobras</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.totalSobras}</div>
            <div className="text-xs text-gray-500 mt-1">
              Média: -{data.sobraMedio.toFixed(1)}%
            </div>
            <div className="mt-2 text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded">
              Desperdício
            </div>
          </div>

          {/* Assertivos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Assertivos</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.ciclosAssertivos}</div>
            <div className="text-xs text-gray-500 mt-1">
              Dentro de ±5%
            </div>
            <div className="mt-2 text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded">
              Planejamento OK
            </div>
          </div>

          {/* Custo Desperdício */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Desperdício</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              R$ {(data.custoDesperdicioEstimado / 1000).toFixed(1)}k
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Custo estimado
            </div>
            <div className="mt-2 text-[10px] text-orange-600 bg-orange-50 px-2 py-1 rounded">
              Oportunidade
            </div>
          </div>
        </div>
      </div>

      {/* Alertas Recentes */}
      {data.alertas.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Alertas Recentes
            </h3>
            <span className="text-xs text-gray-500">{data.alertas.length} alertas</span>
          </div>
          <div className="divide-y divide-gray-50">
            {data.alertas.slice(0, 5).map((alerta, i) => (
              <div 
                key={i}
                className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors"
              >
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${alerta.tipo === 'ruptura' ? 'bg-red-100' : 'bg-amber-100'}
                `}>
                  {alerta.tipo === 'ruptura' ? (
                    <TrendingUp className="w-5 h-5 text-red-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">Filial {alerta.filialId}</span>
                    <span className={`
                      text-xs px-2 py-0.5 rounded-full
                      ${alerta.tipo === 'ruptura' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-amber-100 text-amber-700'}
                    `}>
                      {alerta.tipo === 'ruptura' ? 'RUPTURA' : 'DESPERDÍCIO'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{alerta.mensagem}</p>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${
                    alerta.tipo === 'ruptura' ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {alerta.tipo === 'ruptura' ? '+' : '-'}{alerta.valor.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(parseISO(alerta.data), "dd/MM", { locale: ptBR })}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mini Ranking */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Ranking de Assertividade por Filial
          </h3>
          <span className="text-xs text-gray-500">Top 5</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left font-medium">Pos</th>
                <th className="px-5 py-3 text-left font-medium">Filial</th>
                <th className="px-5 py-3 text-center font-medium">Ciclos</th>
                <th className="px-5 py-3 text-center font-medium">Acerto</th>
                <th className="px-5 py-3 text-center font-medium">Déficits</th>
                <th className="px-5 py-3 text-center font-medium">Sobras</th>
                <th className="px-5 py-3 text-right font-medium">Desperdício</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.filiais.slice(0, 5).map((filial, i) => (
                <tr key={filial.filialId} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <span className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${i === 0 ? 'bg-yellow-100 text-yellow-700' :
                        i === 1 ? 'bg-gray-200 text-gray-700' :
                        i === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'}
                    `}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-medium text-gray-900">Filial {filial.filialId}</span>
                  </td>
                  <td className="px-5 py-3 text-center text-gray-600">{filial.totalCiclos}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`
                      inline-flex px-2 py-1 rounded-full text-xs font-semibold
                      ${filial.taxaAcerto >= 85 ? 'bg-green-100 text-green-700' :
                        filial.taxaAcerto >= 70 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'}
                    `}>
                      {filial.taxaAcerto.toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    {filial.deficits > 0 ? (
                      <span className="text-red-600 font-medium">{filial.deficits}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {filial.sobras > 0 ? (
                      <span className="text-amber-600 font-medium">{filial.sobras}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-600">
                    R$ {filial.custoDesperdicioEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}