import type { ReactNode } from 'react'

/*
 * A tiny, safe markdown renderer for blog posts. It builds React elements (never raw HTML),
 * and only allows http(s)/mailto/relative links and https images.
 *
 * Supported: ## heading, ### heading, **bold**, *italic*, [text](url), - lists, 1. lists, > quote, ![alt](https://image)
 */

const safeHref = (url: string) => (/^(https?:\/\/|mailto:|\/|#)/i.test(url) ? url : '#')

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\))/g
  let last = 0
  let i = 0
  for (const m of text.matchAll(re)) {
    const index = m.index ?? 0
    if (index > last) out.push(text.slice(last, index))
    const token = m[0]
    const key = `${keyBase}-${i++}`
    if (token.startsWith('**')) out.push(<strong key={key}>{token.slice(2, -2)}</strong>)
    else if (token.startsWith('*')) out.push(<em key={key}>{token.slice(1, -1)}</em>)
    else {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(token)
      if (link) {
        const external = /^https?:/i.test(link[2])
        out.push(
          <a key={key} href={safeHref(link[2])} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            {link[1]}
          </a>,
        )
      }
    }
    last = index + token.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function Markdown({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/)
  return (
    <div className="prose-cktv">
      {blocks.map((block, bi) => {
        const lines = block.split('\n').filter((l) => l.trim() !== '')
        if (lines.length === 0) return null
        const key = `b${bi}`
        const first = lines[0]

        if (first.startsWith('### ')) return <h3 key={key}>{inline(first.slice(4), key)}</h3>
        if (first.startsWith('## ')) return <h2 key={key}>{inline(first.slice(3), key)}</h2>
        if (first.startsWith('# ')) return <h2 key={key}>{inline(first.slice(2), key)}</h2>

        const image = /^!\[([^\]]*)\]\((https:\/\/[^)\s]+)\)$/.exec(first.trim())
        if (image && lines.length === 1) {
          return (
            <figure key={key}>
              <img src={image[2]} alt={image[1]} loading="lazy" />
              {image[1] && <figcaption>{image[1]}</figcaption>}
            </figure>
          )
        }

        if (lines.every((l) => /^[-*] /.test(l))) {
          return (
            <ul key={key}>
              {lines.map((l, li) => (
                <li key={li}>{inline(l.slice(2), `${key}-${li}`)}</li>
              ))}
            </ul>
          )
        }
        if (lines.every((l) => /^\d+[.)] /.test(l))) {
          return (
            <ol key={key}>
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^\d+[.)] /, ''), `${key}-${li}`)}</li>
              ))}
            </ol>
          )
        }
        if (lines.every((l) => l.startsWith('> '))) {
          return <blockquote key={key}>{inline(lines.map((l) => l.slice(2)).join(' '), key)}</blockquote>
        }

        return (
          <p key={key}>
            {lines.map((l, li) => (
              <span key={li}>
                {li > 0 && <br />}
                {inline(l, `${key}-${li}`)}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}
