import { useState } from 'react'

const TRUNCATE_LENGTH = 200

type TextPreviewProps = {
  label: string
  text: string
}

export function TextPreview({ label, text }: TextPreviewProps) {
  const [expanded, setExpanded] = useState(false)
  const needsTruncate = text.length > TRUNCATE_LENGTH
  const displayText =
    expanded || !needsTruncate ? text : `${text.slice(0, TRUNCATE_LENGTH)}…`

  return (
    <div className="text-preview">
      <span className="text-preview__label">{label}</span>
      <pre className="text-preview__content">{displayText}</pre>
      {needsTruncate && (
        <button
          type="button"
          className="text-preview__toggle"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}
