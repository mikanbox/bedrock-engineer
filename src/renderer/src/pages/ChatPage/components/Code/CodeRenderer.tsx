import React, { useMemo } from 'react'
import Markdown, { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { HtmlBlock } from './HtmlBlock'
import { MermaidBlock } from './MermaidBlock'
import LocalImage from '@renderer/components/LocalImage'
import style from '@renderer/components/Markdown/styles.module.css'
import 'katex/dist/katex.min.css'

// Types
type CodeRendererProps = {
  text?: string
  className?: string
}

type AnchorProps = {
  href?: string
  children?: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

type ImgProps = {
  src?: string
  alt?: string
  className?: string
}

type CodeProps = {
  inline?: boolean
  className?: string
  children?: React.ReactNode
}

// Main Component
export const CodeRenderer: React.FC<CodeRendererProps> = ({ text = '', className = '' }) => {
  const components: Partial<Components> = useMemo(() => {
    return {
      a: (props: AnchorProps) => (
        <a
          {...props}
          onClick={(e) => {
            e.preventDefault()
            if (props.href) {
              open(props.href)
            }
          }}
          style={{ cursor: 'pointer' }}
        />
      ),
      img: ({ src, alt, ...props }: ImgProps) => {
        if (src?.startsWith('/')) {
          return <LocalImage src={src} alt={alt || ''} {...props} />
        }
        return <img src={src} alt={alt} {...props} />
      },
      code: ({ inline, className, children, ...props }: CodeProps) => {
        const match = /language-(\w+)/.exec(className || '')
        const language = match ? match[1] : ''
        const codeContent = String(children).replace(/\n$/, '')

        // Handle block code (not inline)
        if (!inline) {
          // Special handling for HTML blocks
          if (language === 'html') {
            return <HtmlBlock code={codeContent} />
          }

          // Special handling for Mermaid blocks
          if (language === 'mermaid') {
            return <MermaidBlock code={codeContent} />
          }
        }

        // Inline code
        return (
          <code className={className} {...props}>
            {children}
          </code>
        )
      }
    }
  }, [])

  return (
    <div className={`w-full dark:text-white ${className}`}>
      <Markdown
        className={style.reactMarkDown}
        remarkPlugins={[[remarkGfm, { singleTilde: false }], [remarkMath]]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {text}
      </Markdown>
    </div>
  )
}

export default CodeRenderer
