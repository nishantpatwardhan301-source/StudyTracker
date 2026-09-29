// Renders the plain-text maths notation used in the question bank as real
// maths: (a)/(b) -> stacked fraction, √(x) -> root with a bar, ^(x) -> superscript,
// _(x) -> subscript. Lines made of "a | b | c" cells become small tables.

function matchParen(s, open) {
  let depth = 0
  for (let j = open; j < s.length; j++) {
    if (s[j] === '(') depth++
    else if (s[j] === ')' && --depth === 0) return j
  }
  return -1
}

export function parseMath(s) {
  const out = []
  let buf = ''
  let i = 0
  const flush = () => { if (buf) { out.push(buf); buf = '' } }

  while (i < s.length) {
    const c = s[i]

    if (c === '(') {
      const j = matchParen(s, i)
      if (j < 0) { buf += c; i++; continue }
      const inner = s.slice(i + 1, j)
      if (s[j + 1] === '/' && s[j + 2] === '(') {
        const k = matchParen(s, j + 2)
        if (k > 0) {
          flush()
          out.push({ t: 'frac', num: parseMath(inner), den: parseMath(s.slice(j + 3, k)) })
          i = k + 1
          continue
        }
      }
      flush()
      out.push({ t: 'group', c: parseMath(inner) })
      i = j + 1
      continue
    }

    if (c === '√') {
      if (s[i + 1] === '(') {
        const j = matchParen(s, i + 1)
        if (j > 0) { flush(); out.push({ t: 'sqrt', c: parseMath(s.slice(i + 2, j)) }); i = j + 1; continue }
      }
      const m = /^(\d+(\.\d+)?|[A-Za-zα-ωπ])/.exec(s.slice(i + 1))
      if (m) { flush(); out.push({ t: 'sqrt', c: [m[0]] }); i += 1 + m[0].length; continue }
    }

    if ((c === '^' || c === '_') && s[i + 1] === '(') {
      const j = matchParen(s, i + 1)
      if (j > 0) { flush(); out.push({ t: c === '^' ? 'sup' : 'sub', c: parseMath(s.slice(i + 2, j)) }); i = j + 1; continue }
    }

    buf += c
    i++
  }
  flush()
  return out
}

function Nodes({ nodes }) {
  return nodes.map((n, i) => {
    if (typeof n === 'string') return <span key={i}>{n}</span>
    switch (n.t) {
      case 'frac':
        return (
          <span key={i} className="m-frac">
            <span className="m-num"><Nodes nodes={n.num} /></span>
            <span className="m-den"><Nodes nodes={n.den} /></span>
          </span>
        )
      case 'sqrt':
        return (
          <span key={i} className="m-sqrt">
            <span className="m-rad">√</span>
            <span className="m-rc"><Nodes nodes={n.c} /></span>
          </span>
        )
      case 'sup':
        return <sup key={i}><Nodes nodes={n.c} /></sup>
      case 'sub':
        return <sub key={i}><Nodes nodes={n.c} /></sub>
      default:
        return <span key={i}>(<Nodes nodes={n.c} />)</span>
    }
  })
}

const Line = ({ text }) => <Nodes nodes={parseMath(text)} />
const isTableRow = (line) => (line.match(/\|/g) || []).length >= 2

export default function MathText({ text, className = '' }) {
  const lines = String(text ?? '').trim().split('\n')
  const blocks = []
  for (const line of lines) {
    const last = blocks[blocks.length - 1]
    if (isTableRow(line)) {
      if (last?.table) last.rows.push(line)
      else blocks.push({ table: true, rows: [line] })
    } else blocks.push({ table: false, line })
  }

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
          <span key={i}>
            {i > 0 && !blocks[i - 1].table && <br />}
            <Line text={b.table ? b.rows[0] : b.line} />
          </span>
        )
      )}
    </span>
  )
}
