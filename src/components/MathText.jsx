import { memo, useMemo } from 'react'
import katex from 'katex'
import { chunkLine, nodesToLatex, plain } from '../lib/mathLatex'

// Typesets question text with KaTeX. The bank's plain-text notation is converted to
// LaTeX (see lib/mathLatex.js); prose stays as normal text and wraps naturally.
// Lines made of "a | b | c" cells become small tables.

function renderChunk(nodes) {
  try {
    return katex.renderToString(nodesToLatex(nodes), { throwOnError: true, strict: 'ignore', output: 'html' })
  } catch {
    return null
  }
}

function Line({ text }) {
  const parts = useMemo(() => chunkLine(text), [text])
  return parts.map((c, i) => {
    if (c.space) return <span key={i}>{c.space}</span>
    if (!c.math) return <span key={i}>{c.text}</span>
    const html = renderChunk(c.nodes)
    return html
      ? <span key={i} className="kx" dangerouslySetInnerHTML={{ __html: html }} />
      : <span key={i}>{c.nodes.map(plain).join('')}</span>
  })
}

const isTableRow = (line) => (line.match(/\|/g) || []).length >= 2

function MathText({ text, className = '' }) {
  const blocks = useMemo(() => {
    const out = []
    for (const line of String(text ?? '').trim().split('\n')) {
      const last = out[out.length - 1]
      if (isTableRow(line)) {
        if (last?.table) last.rows.push(line)
        else out.push({ table: true, rows: [line] })
      } else out.push({ table: false, line })
    }
    return out
  }, [text])

  return (
    <span className={`math ${className}`}>
      {blocks.map((b, i) =>
        b.table && b.rows.length > 1 ? (
          <span key={i} className="m-table-wrap">
            <table className="m-table">
              <tbody>
                {b.rows.map((r, ri) => (
                  <tr key={ri}>{r.split('|').map((cell, ci) => <td key={ci}><Line text={cell.trim()} /></td>)}</tr>
                ))}
              </tbody>
            </table>
          </span>
        ) : (
          <span key={i} className="m-line">
            <Line text={b.table ? b.rows[0] : b.line} />
          </span>
        )
      )}
    </span>
  )
}

export default memo(MathText)
