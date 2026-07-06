"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  /** Markdown source string */
  content: string;
  /** Additional class names on the wrapper */
  className?: string;
}

/**
 * Renders markdown with dark-theme styling and custom element overrides.
 * Uses `react-markdown` which is already installed in the project.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        components={{
          // Headings
          h1: ({ children, ...props }) => (
            <h1
              className="mt-6 mb-3 text-2xl font-bold text-foreground first:mt-0"
              {...props}
            >
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2
              className="mt-5 mb-2 text-xl font-semibold text-foreground first:mt-0"
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3
              className="mt-4 mb-2 text-lg font-semibold text-foreground"
              {...props}
            >
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4
              className="mt-3 mb-1.5 text-base font-semibold text-foreground"
              {...props}
            >
              {children}
            </h4>
          ),
          h5: ({ children, ...props }) => (
            <h5
              className="mt-3 mb-1 text-sm font-semibold text-foreground"
              {...props}
            >
              {children}
            </h5>
          ),
          h6: ({ children, ...props }) => (
            <h6
              className="mt-2 mb-1 text-sm font-medium text-muted-foreground"
              {...props}
            >
              {children}
            </h6>
          ),

          // Paragraph
          p: ({ children, ...props }) => (
            <p
              className="mb-3 leading-7 text-foreground/80 last:mb-0"
              {...props}
            >
              {children}
            </p>
          ),

          // Lists
          ul: ({ children, ...props }) => (
            <ul
              className="mb-3 ml-5 list-disc space-y-1 text-foreground/80 last:mb-0"
              {...props}
            >
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol
              className="mb-3 ml-5 list-decimal space-y-1 text-foreground/80 last:mb-0"
              {...props}
            >
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="leading-7" {...props}>
              {children}
            </li>
          ),

          // Inline code
          code: ({ className: _className, children, ...props }) => {
            // Detect if inside a <pre> by checking for newlines
            const isInline = !String(children).includes("\n");
            if (isInline) {
              return (
                <code
                  className="rounded bg-muted px-1.5 py-0.5 text-[13px] font-mono text-emerald-400 dark:bg-muted/60 dark:text-emerald-300"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="block overflow-x-auto rounded-md bg-muted/50 p-3 text-[13px] font-mono leading-relaxed text-foreground/90 dark:bg-muted/30"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Blockquote
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="my-3 border-l-2 border-border/60 pl-4 italic text-muted-foreground"
              {...props}
            >
              {children}
            </blockquote>
          ),

          // Table
          table: ({ children, ...props }) => (
            <div className="my-3 overflow-x-auto rounded-md border border-border/40">
              <table
                className="w-full text-sm text-foreground/80"
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead
              className="border-b border-border/40 bg-muted/30"
              {...props}
            >
              {children}
            </thead>
          ),
          th: ({ children, ...props }) => (
            <th
              className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td
              className="border-b border-border/20 px-3 py-2 last:border-b-0"
              {...props}
            >
              {children}
            </td>
          ),

          // Links – open in new tab
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:decoration-primary"
              {...props}
            >
              {children}
            </a>
          ),

          // Horizontal rule
          hr: (props) => (
            <hr
              className="my-4 border-border/40"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}