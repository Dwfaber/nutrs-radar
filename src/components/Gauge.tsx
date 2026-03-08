interface GaugeProps {
  value: number // 0-100
  label: string
  sublabel?: string
  size?: 'sm' | 'md' | 'lg'
  thresholds?: {
    danger: number  // abaixo disso = vermelho
    warning: number // abaixo disso = amarelo, acima = verde
  }
}

export function Gauge({ 
  value, 
  label, 
  sublabel,
  size = 'md',
  thresholds = { danger: 70, warning: 85 }
}: GaugeProps) {
  // Limitar valor entre 0 e 100
  const clampedValue = Math.max(0, Math.min(100, value))
  
  // Calcular ângulo do ponteiro (-90 a 90 graus)
  const angle = -90 + (clampedValue / 100) * 180
  
  // Determinar cor baseada nos thresholds
  const getColor = () => {
    if (clampedValue < thresholds.danger) return { main: '#ef4444', bg: '#fee2e2', text: 'text-red-600' }
    if (clampedValue < thresholds.warning) return { main: '#f59e0b', bg: '#fef3c7', text: 'text-amber-600' }
    return { main: '#22c55e', bg: '#dcfce7', text: 'text-green-600' }
  }
  
  const colors = getColor()
  
  // Tamanhos
  const sizes = {
    sm: { width: 140, height: 80, fontSize: 'text-2xl', labelSize: 'text-xs' },
    md: { width: 200, height: 110, fontSize: 'text-4xl', labelSize: 'text-sm' },
    lg: { width: 280, height: 150, fontSize: 'text-5xl', labelSize: 'text-base' }
  }
  
  const s = sizes[size]

  return (
    <div className="flex flex-col items-center">
      <svg 
        width={s.width} 
        height={s.height} 
        viewBox="0 0 200 110"
        className="overflow-visible"
      >
        {/* Fundo do arco */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="16"
          strokeLinecap="round"
        />
        
        {/* Arco de progresso */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={colors.main}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${(clampedValue / 100) * 251.2} 251.2`}
          className="transition-all duration-700 ease-out"
        />
        
        {/* Marcadores */}
        {[0, 25, 50, 75, 100].map((mark) => {
          const markAngle = (-90 + (mark / 100) * 180) * (Math.PI / 180)
          const x1 = 100 + 65 * Math.cos(markAngle)
          const y1 = 100 + 65 * Math.sin(markAngle)
          const x2 = 100 + 72 * Math.cos(markAngle)
          const y2 = 100 + 72 * Math.sin(markAngle)
          return (
            <line
              key={mark}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#9ca3af"
              strokeWidth="2"
            />
          )
        })}
        
        {/* Ponteiro */}
        <g 
          transform={`rotate(${angle}, 100, 100)`}
          className="transition-transform duration-700 ease-out"
        >
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="35"
            stroke={colors.main}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle
            cx="100"
            cy="100"
            r="8"
            fill={colors.main}
          />
          <circle
            cx="100"
            cy="100"
            r="4"
            fill="white"
          />
        </g>
        
        {/* Labels de min/max */}
        <text x="15" y="108" fontSize="10" fill="#9ca3af" textAnchor="middle">0</text>
        <text x="185" y="108" fontSize="10" fill="#9ca3af" textAnchor="middle">100</text>
      </svg>
      
      {/* Valor central */}
      <div className={`-mt-12 text-center`}>
        <div className={`${s.fontSize} font-bold ${colors.text}`}>
          {clampedValue.toFixed(1)}%
        </div>
        <div className={`${s.labelSize} font-medium text-gray-700 mt-1`}>{label}</div>
        {sublabel && (
          <div className="text-xs text-gray-500 mt-0.5">{sublabel}</div>
        )}
      </div>
    </div>
  )
}
