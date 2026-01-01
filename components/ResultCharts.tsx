'use client'

interface PieChartProps {
  correct: number
  wrong: number
  unanswered: number
}

export function PieChart({ correct, wrong, unanswered }: PieChartProps) {
  const total = correct + wrong + unanswered
  if (total === 0) return null

  const correctPercent = (correct / total) * 100
  const wrongPercent = (wrong / total) * 100
  const unansweredPercent = (unanswered / total) * 100

  // Calculate angles for pie chart
  const correctAngle = (correctPercent / 100) * 360
  const wrongAngle = (wrongPercent / 100) * 360
  const unansweredAngle = (unansweredPercent / 100) * 360

  // SVG path calculations
  const radius = 80
  const centerX = 100
  const centerY = 100

  const correctStartAngle = 0
  const correctEndAngle = correctAngle
  const wrongStartAngle = correctEndAngle
  const wrongEndAngle = wrongStartAngle + wrongAngle
  const unansweredStartAngle = wrongEndAngle
  const unansweredEndAngle = unansweredStartAngle + unansweredAngle

  const createArc = (startAngle: number, endAngle: number) => {
    const start = (startAngle * Math.PI) / 180
    const end = (endAngle * Math.PI) / 180
    const x1 = centerX + radius * Math.cos(start)
    const y1 = centerY + radius * Math.sin(start)
    const x2 = centerX + radius * Math.cos(end)
    const y2 = centerY + radius * Math.sin(end)
    const largeArc = endAngle - startAngle > 180 ? 1 : 0
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
  }

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="200" viewBox="0 0 200 200" className="mb-4">
        {correct > 0 && (
          <path
            d={createArc(correctStartAngle, correctEndAngle)}
            fill="#10b981"
            stroke="white"
            strokeWidth="2"
          />
        )}
        {wrong > 0 && (
          <path
            d={createArc(wrongStartAngle, wrongEndAngle)}
            fill="#ef4444"
            stroke="white"
            strokeWidth="2"
          />
        )}
        {unanswered > 0 && (
          <path
            d={createArc(unansweredStartAngle, unansweredEndAngle)}
            fill="#9ca3af"
            stroke="white"
            strokeWidth="2"
          />
        )}
      </svg>
      <div className="space-y-2 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Correct: {correct} ({correctPercent.toFixed(1)}%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Wrong: {wrong} ({wrongPercent.toFixed(1)}%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-400 rounded"></div>
          <span>Unanswered: {unanswered} ({unansweredPercent.toFixed(1)}%)</span>
        </div>
      </div>
    </div>
  )
}

interface BarChartProps {
  data: Array<{ label: string; correct: number; wrong: number; total: number }>
}

export function SubjectBarChart({ data }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.total), 1)

  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const correctPercent = item.total > 0 ? (item.correct / item.total) * 100 : 0
        const wrongPercent = item.total > 0 ? (item.wrong / item.total) * 100 : 0
        const unansweredPercent = item.total > 0 ? ((item.total - item.correct - item.wrong) / item.total) * 100 : 0

        return (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900 text-sm">{item.label}</span>
              <span className="text-xs text-gray-600">
                {item.correct}/{item.total} ({correctPercent.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden flex">
              {correctPercent > 0 && (
                <div
                  className="bg-green-500 h-full flex items-center justify-center text-white text-xs font-semibold"
                  style={{ width: `${correctPercent}%` }}
                >
                  {correctPercent >= 10 && `${item.correct}`}
                </div>
              )}
              {wrongPercent > 0 && (
                <div
                  className="bg-red-500 h-full flex items-center justify-center text-white text-xs font-semibold"
                  style={{ width: `${wrongPercent}%` }}
                >
                  {wrongPercent >= 10 && `${item.wrong}`}
                </div>
              )}
              {unansweredPercent > 0 && (
                <div
                  className="bg-gray-400 h-full flex items-center justify-center text-white text-xs font-semibold"
                  style={{ width: `${unansweredPercent}%` }}
                >
                  {unansweredPercent >= 10 && `${item.total - item.correct - item.wrong}`}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}




