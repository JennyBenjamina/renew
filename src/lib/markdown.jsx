/* Minimal, dependency-free Markdown renderer for blog post bodies.
 * Supports the subset the editor uses: ## / ### headings, paragraphs,
 * unordered lists (- ), **bold**, and [text](url) links. Blank lines
 * separate blocks. Output is semantic HTML (h2/h3/p/ul/li/a/strong) — good
 * for SEO and screen readers. Input is trusted (admin-authored), but link
 * hrefs are still constrained to http(s)/mailto to avoid javascript: URIs. */

function renderInline(text, keyPrefix) {
  const nodes = []
  let remaining = text
  let i = 0
  // Alternating tokenizer for **bold** and [text](url).
  const pattern = /(\*\*([^*]+)\*\*)|(\[([^\]]+)\]\(([^)]+)\))/
  let m
  while ((m = pattern.exec(remaining))) {
    if (m.index > 0) nodes.push(remaining.slice(0, m.index))
    if (m[1]) {
      nodes.push(<strong key={`${keyPrefix}-b${i}`}>{m[2]}</strong>)
    } else if (m[3]) {
      const href = m[5].trim()
      const safe = /^(https?:|mailto:|\/)/i.test(href) ? href : '#'
      const external = /^https?:/i.test(safe)
      nodes.push(
        <a
          key={`${keyPrefix}-l${i}`}
          href={safe}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {m[4]}
        </a>
      )
    }
    remaining = remaining.slice(m.index + m[0].length)
    i++
  }
  if (remaining) nodes.push(remaining)
  return nodes
}

export function Markdown({ text = '' }) {
  const lines = String(text).replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let para = []
  let list = []

  const flushPara = () => {
    if (para.length) {
      const key = `p${blocks.length}`
      blocks.push(<p key={key}>{renderInline(para.join(' '), key)}</p>)
      para = []
    }
  }
  const flushList = () => {
    if (list.length) {
      const key = `ul${blocks.length}`
      blocks.push(
        <ul key={key}>
          {list.map((item, idx) => (
            <li key={`${key}-${idx}`}>{renderInline(item, `${key}-${idx}`)}</li>
          ))}
        </ul>
      )
      list = []
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line.trim()) {
      flushPara()
      flushList()
      continue
    }
    if (line.startsWith('### ')) {
      flushPara()
      flushList()
      const key = `h3-${blocks.length}`
      blocks.push(<h3 key={key}>{renderInline(line.slice(4), key)}</h3>)
    } else if (line.startsWith('## ')) {
      flushPara()
      flushList()
      const key = `h2-${blocks.length}`
      blocks.push(<h2 key={key}>{renderInline(line.slice(3), key)}</h2>)
    } else if (/^[-*]\s+/.test(line)) {
      flushPara()
      list.push(line.replace(/^[-*]\s+/, ''))
    } else {
      flushList()
      para.push(line.trim())
    }
  }
  flushPara()
  flushList()
  return <>{blocks}</>
}

/** Strip Markdown to plain text (for meta descriptions / excerpts fallback). */
export function stripMarkdown(text = '', max = 160) {
  const plain = String(text)
    .replace(/[#*_>`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > max ? plain.slice(0, max - 1).trimEnd() + '…' : plain
}
