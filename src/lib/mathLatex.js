// Converts the question bank's plain-text maths notation into LaTeX for KaTeX.
//   (a)/(b) -> \dfrac{a}{b}     √(x) or √3 -> \sqrt{x}     ^(x) -> ^{x}     _(x) -> _{x}
//   x² / x⁻¹ / T₁ (Unicode super/subscripts) -> x^{2} / x^{-1} / T_{1}
// A line is split into space-separated chunks; chunks containing maths are typeset,
// the rest stays as normal text, so sentences keep their natural wrapping.

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

const isMathNode = (n) => typeof n !== 'string' && (n.t !== 'group' || n.c.some(isMathNode))
const SUP = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', '⁻': '-', '⁼': '=', '⁽': '(', '⁾': ')', 'ᐟ': '/', 'ⁿ': 'n', 'ⁱ': 'i', 'ˣ': 'x', 'ʸ': 'y', 'ᵃ': 'a', 'ᵇ': 'b',
  'ᶜ': 'c', 'ᵈ': 'd', 'ᵉ': 'e', 'ᶠ': 'f', 'ᵍ': 'g', 'ʰ': 'h', 'ʲ': 'j', 'ᵏ': 'k', 'ˡ': 'l', 'ᵐ': 'm', 'ᵒ': 'o', 'ᵖ': 'p',
  'ʳ': 'r', 'ˢ': 's', 'ᵗ': 't', 'ᵘ': 'u', 'ᵛ': 'v', 'ʷ': 'w', 'ᶻ': 'z', 'ᵀ': 'T', 'ᴬ': 'A', 'ᴮ': 'B', 'ᴺ': 'N', 'ᴿ': 'R', 'ᵞ': '\\gamma ', 'ᵝ': '\\beta ', 'ᵟ': '\\delta ', 'ᶿ': '\\theta ',
}
const SUB = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  '₊': '+', '₋': '-', '₌': '=', '₍': '(', '₎': ')', 'ₐ': 'a', 'ₑ': 'e', 'ₒ': 'o', 'ₓ': 'x', 'ᵢ': 'i', 'ⱼ': 'j', 'ₕ': 'h',
  'ₖ': 'k', 'ₗ': 'l', 'ₘ': 'm', 'ₙ': 'n', 'ₚ': 'p', 'ₛ': 's', 'ₜ': 't', 'ᵣ': 'r', 'ᵤ': 'u', 'ᵥ': 'v',
}
const SCRIPT_RE = new RegExp(`[${Object.keys(SUP).join('')}${Object.keys(SUB).join('')}]`)
const hasUnicodeScript = (s) => SCRIPT_RE.test(s)
// Combining marks written after a letter: a̅ (vector bar), Ċ (radical dot), a⃗ ...
const ACCENT = { '\u0305': 'overline', '\u0304': 'bar', '\u0307': 'dot', '\u0308': 'ddot', '\u0302': 'hat', '\u0303': 'tilde', '\u20d7': 'vec', '\u20d1': 'vec' }
const isMark = (c) => /[\u0300-\u036f\u20d0-\u20ff]/.test(c)
const escapeText = (w) => w.replace(/[\\{}$&#%_^~]/g, (m) => `\\${m === '\\' ? 'backslash ' : m}`)
const SYMBOL = {
  '∫': '\\int ', '∑': '\\sum ', '·': '\\cdot ', '×': '\\times ', '÷': '\\div ', '−': '-', '–': '-', '∞': '\\infty ',
  '→': '\\to ', '⇒': '\\Rightarrow ', '↔': '\\leftrightarrow ', '∈': '\\in ', '∉': '\\notin ', '≤': '\\le ', '≥': '\\ge ',
  '≠': '\\ne ', '≈': '\\approx ', '∼': '\\sim ', '~': '\\sim ', '∧': '\\land ', '∨': '\\lor ', '°': '^{\\circ}',
  '∠': '\\angle ', '⊥': '\\perp ', '∥': '\\parallel ', '±': '\\pm ', '∆': '\\Delta ', 'Δ': '\\Delta ', '∂': '\\partial ',
  '∪': '\\cup ', '∩': '\\cap ', '⊂': '\\subset ', '∅': '\\emptyset ', '∀': '\\forall ', '∃': '\\exists ', '∴': '\\therefore ',
  'α': '\\alpha ', 'β': '\\beta ', 'γ': '\\gamma ', 'δ': '\\delta ', 'ε': '\\varepsilon ', 'ϵ': '\\epsilon ', 'θ': '\\theta ', 'λ': '\\lambda ',
  'μ': '\\mu ', 'ν': '\\nu ', 'π': '\\pi ', 'ρ': '\\rho ', 'σ': '\\sigma ', 'τ': '\\tau ', 'φ': '\\phi ', 'ϕ': '\\phi ',
  'ω': '\\omega ', 'Ω': '\\Omega ', 'η': '\\eta ', 'ξ': '\\xi ', 'χ': '\\chi ', 'ψ': '\\psi ', 'ζ': '\\zeta ', 'κ': '\\kappa ',
  '⩽': '\\leqslant ', '⩾': '\\geqslant ', '‖': '\\| ', '‾': '\\overline{\\ }', '∝': '\\propto ', '⇌': '\\rightleftharpoons ', '⟶': '\\longrightarrow ', '←': '\\leftarrow ', '↑': '\\uparrow ', '↓': '\\downarrow ',
  '≡': '\\equiv ', '≅': '\\cong ', '⊕': '\\oplus ', '√': '\\surd ', '∗': '*', '…': '\\ldots ', '′′': "''", 'ℓ': '\\ell ', 'Å': '\\text{Å}',
  '%': '\\%', '#': '\\#', '&': '\\&', '$': '\\$', '{': '\\{', '}': '\\}', '\\': '\\backslash ', '′': "'", '’': "'",
}
const FUNCS = ['arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln', 'lim', 'exp', 'max', 'min', 'det']

function textToLatex(raw) {
  const s = raw.normalize('NFD')
  let out = ''
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (isMark(c) || /[\u200b-\u200f\u2060-\u2064\ufeff]/.test(c)) { i++; continue }
    if (i + 1 < s.length && isMark(s[i + 1]) && !SUP[c] && !SUB[c]) {
      const accent = ACCENT[s[i + 1]]
      const base = SYMBOL[c] ?? c
      out += accent ? `\\${accent}{${base}}` : base
      i += 2
      while (i < s.length && isMark(s[i])) i++
      continue
    }
    if (SUP[c]) {
      let run = ''
      while (i < s.length && SUP[s[i]]) run += SUP[s[i++]]
      out += `^{${run}}`
      continue
    }
    if (SUB[c]) {
      let run = ''
      while (i < s.length && SUB[s[i]]) run += SUB[s[i++]]
      out += `_{${run}}`
      continue
    }
    const word = /^[A-Za-z]{2,}/.exec(s.slice(i))
    if (word) {
      const w = word[0]
      if (w === 'cosec') out += '\\operatorname{cosec} '
      else if (FUNCS.includes(w)) out += `\\${w} `
      else if (w.length >= 3) out += `\\text{${escapeText(w)}}`
      else out += w
      i += w.length
      continue
    }
    if (c === '^' || c === '_') out += `\\${c === '^' ? 'wedge' : '_'} `
    else if (SYMBOL[c] !== undefined) out += SYMBOL[c]
    else if (c === ' ') out += '\\ '
    else if (/[A-Za-z0-9+\-=<>()[\],.;:!?'|/*]/.test(c)) out += c
    else out += `\\text{${escapeText(c)}}`
    i++
  }
  return out
}

export function nodesToLatex(nodes, depth = 0) {
  return nodes.map((n) => {
    if (typeof n === 'string') return textToLatex(n)
    switch (n.t) {
      case 'frac':
        return `${depth === 0 ? '\\dfrac' : '\\frac'}{${nodesToLatex(n.num, depth + 1)}}{${nodesToLatex(n.den, depth + 1)}}`
      case 'sqrt':
        return `\\sqrt{${nodesToLatex(n.c, depth)}}`
      case 'sup':
        return `^{${nodesToLatex(n.c, depth + 1)}}`
      case 'sub':
        return `_{${nodesToLatex(n.c, depth + 1)}}`
      default:
        return `\\left(${nodesToLatex(n.c, depth)}\\right)`
    }
  }).join('')
}

// Splits a line into chunks: { math: false, text } or { math: true, nodes }.
export function chunkLine(line) {
  const nodes = parseMath(line)
  const chunks = []
  let cur = []
  const push = () => {
    if (!cur.length) return
    const math = cur.some(isMathNode) || cur.some((n) => typeof n === 'string' && hasUnicodeScript(n))
    chunks.push(math ? { math: true, nodes: cur } : { math: false, text: cur.map(plain).join('') })
    cur = []
  }
  for (const n of nodes) {
    if (typeof n !== 'string') { cur.push(n); continue }
    const parts = n.split(/(\s+)/)
    parts.forEach((p) => {
      if (/^\s+$/.test(p)) { push(); chunks.push({ space: p }) }
      else if (p) cur.push(p)
    })
  }
  push()
  // Short formula fragments next to typeset maths ("x+c", "dx=", "a") are typeset too,
  // but ordinary words ("is", "of", "the") stay as text.
  if (chunks.some((c) => c.math)) {
    for (const c of chunks) {
      if (c.math || c.space) continue
      const t = c.text
      if (/^[A-Za-z]$/.test(t) || (/[0-9=+\-*/<>^]/.test(t) && !/[A-Za-z]{3,}/.test(t))) {
        c.math = true
        c.nodes = parseMath(t)
      }
    }
  }
  return chunks
}

// Plain-text fallback for a node (used for non-maths chunks).
export function plain(n) {
  if (typeof n === 'string') return n
  if (n.t === 'group') return `(${n.c.map(plain).join('')})`
  if (n.t === 'frac') return `(${n.num.map(plain).join('')})/(${n.den.map(plain).join('')})`
  if (n.t === 'sqrt') return `√(${n.c.map(plain).join('')})`
  return n.c.map(plain).join('')
}
