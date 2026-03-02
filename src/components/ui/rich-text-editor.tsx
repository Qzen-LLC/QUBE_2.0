'use client'

import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, List, ListOrdered, Quote, Undo, Redo } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ content, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc list-outside pl-6',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal list-outside pl-6',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'text-gray-700 dark:text-gray-300 my-0',
          },
        },
        paragraph: {
          HTMLAttributes: {
            class: 'm-0',
          },
        },
      }),
    ],
    content: content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[100px] p-3 text-gray-900 dark:text-white',
      },
    },
  })

  // Update editor content when prop changes
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false)
    }
  }, [editor, content])

  if (!editor) {
    return null
  }

  return (
    <div className={cn('border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800', className)}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-600 p-2 flex items-center gap-1 flex-wrap bg-gray-100 dark:bg-gray-700">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            'h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600',
            editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            'h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600',
            editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-500 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            'h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600',
            editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            'h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600',
            editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            'h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600',
            editor.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-500 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Editor Content */}
      <div className="relative">
        <EditorContent 
          editor={editor} 
          className="min-h-[100px] bg-white dark:bg-gray-700"
        />
        {!content && (
          <div className="absolute top-3 left-3 text-gray-400 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  )
}