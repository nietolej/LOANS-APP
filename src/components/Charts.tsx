interface BarChartProps {
  data: { label: string; value: number }[]
  color?: string
  formatValue?: (v: number) => string
  vacio?: string
}

export function BarChart({ data, color = '#4f46e5', formatValue, vacio }: BarChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-500">{vacio ?? 'Sin datos suficientes.'}</p>
  }
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2 text-sm">
          <span className="w-24 shrink-0 truncate text-gray-600" title={d.label}>
            {d.label}
          </span>
          <div className="flex-1 bg-gray-100 rounded h-4 overflow-hidden">
            <div
              className="h-full rounded transition-all"
              style={{ width: `${Math.max(2, (d.value / max) * 100)}%`, backgroundColor: color }}
            />
          </div>
          <span className="w-24 shrink-0 text-right text-gray-700 text-xs">
            {formatValue ? formatValue(d.value) : d.value}
          </span>
        </div>
      ))}
    </div>
  )
}

interface PuntoSerie {
  fecha: string
  valor: number
}

interface StepLineChartProps {
  points: PuntoSerie[]
  color?: string
  formatValue?: (v: number) => string
  formatFecha?: (f: string) => string
  vacio?: string
}

export function StepLineChart({
  points,
  color = '#0ea5e9',
  formatValue = (v) => String(v),
  formatFecha = (f) => f,
  vacio,
}: StepLineChartProps) {
  if (points.length < 2) {
    return <p className="text-sm text-gray-500">{vacio ?? 'Sin datos suficientes.'}</p>
  }

  const width = 640
  const height = 200
  const padLeft = 4
  const padRight = 4
  const padTop = 10
  const padBottom = 10
  const innerW = width - padLeft - padRight
  const innerH = height - padTop - padBottom

  const maxValor = Math.max(1, ...points.map((p) => p.valor))
  const minTime = new Date(points[0].fecha).getTime()
  const maxTime = new Date(points[points.length - 1].fecha).getTime()
  const timeSpan = Math.max(1, maxTime - minTime)

  const x = (fecha: string) => padLeft + ((new Date(fecha).getTime() - minTime) / timeSpan) * innerW
  const y = (valor: number) => padTop + innerH - (valor / maxValor) * innerH

  let path = `M ${x(points[0].fecha)} ${y(points[0].valor)}`
  for (let i = 1; i < points.length; i++) {
    path += ` H ${x(points[i].fecha)} V ${y(points[i].valor)}`
  }
  const ultimoPunto = points[points.length - 1]
  const areaPath = `${path} L ${x(ultimoPunto.fecha)} ${padTop + innerH} L ${x(points[0].fecha)} ${padTop + innerH} Z`

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40" preserveAspectRatio="none">
        <path d={areaPath} fill={color} opacity="0.12" />
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle key={i} cx={x(p.fecha)} cy={y(p.valor)} r="3" fill={color} />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{formatFecha(points[0].fecha)}</span>
        <span className="font-medium text-gray-700">Hoy: {formatValue(ultimoPunto.valor)}</span>
        <span>{formatFecha(ultimoPunto.fecha)}</span>
      </div>
    </div>
  )
}

interface StackedSegment {
  label: string
  value: number
  color: string
}

export function StackedBar({ segments }: { segments: StackedSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  if (total <= 0) {
    return <p className="text-sm text-gray-500">Sin datos suficientes.</p>
  }
  return (
    <div className="space-y-2">
      <div className="flex h-4 rounded overflow-hidden bg-gray-100">
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <div
              key={s.label}
              style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
              title={`${s.label}: ${s.value}`}
            />
          ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-gray-600">
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: s.color }} />
            {s.label} ({s.value})
          </span>
        ))}
      </div>
    </div>
  )
}
