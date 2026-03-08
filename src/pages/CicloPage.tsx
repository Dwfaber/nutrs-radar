import { useParams, useNavigate } from 'react-router-dom'
import { useCicloDetalhe } from '@/hooks/useCiclos'
import { GanttView } from '@/components/GanttView'
import { RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react'

export function CicloPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const cicloId = parseInt(id || '0')
  
  const { ciclo, diarios, acrescimos, loading, error } = useCicloDetalhe(cicloId)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Carregando ciclo #{cicloId}...</span>
        </div>
      </div>
    )
  }

  if (error || !ciclo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ciclo não encontrado</h2>
          <p className="text-gray-500 mb-6">
            {error || `O ciclo #${cicloId} não existe ou não foi possível carregá-lo.`}
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <GanttView
        ciclo={ciclo}
        diarios={diarios}
        acrescimos={acrescimos}
        onClose={() => navigate('/')}
      />
    </div>
  )
}
