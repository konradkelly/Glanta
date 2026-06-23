import { treeRingPixels } from './logoPixels'

type TreeRingLogoProps = {
  size?: number
  className?: string
}

export function TreeRingLogo({ size = 40, className = '' }: TreeRingLogoProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className={`logo ${className}`.trim()}
      shapeRendering="crispEdges"
      role="img"
      aria-label="Glanta"
    >
      {treeRingPixels.map(([x, y, fill], i) => (
        <rect key={i} x={x} y={y} width={1} height={1} fill={fill} />
      ))}
    </svg>
  )
}
