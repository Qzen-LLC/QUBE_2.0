'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Textarea } from './textarea'
import { Button } from './button'
import { Label } from './label'
import { cn } from '@/lib/utils'
import { List, ListOrdered, Type, Trash2, Bold, Italic } from 'lucide-react'

interface SimpleBulletEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  label?: string
  type?: 'bullet' | 'ordered' | 'text' | 'auto'
}

export function SimpleBulletEditor({ 
  content, 
  onChange, 
  placeholder = "Enter your content...", 
  className,
  label,
  type = 'auto'
}: SimpleBulletEditorProps) {
  const [textContent, setTextContent] = useState('')
  const [listType, setListType] = useState<'bullet' | 'ordered' | 'text'>(type === 'auto' ? 'bullet' : type)
  const isUpdatingRef = useRef(false)
  const lastContentRef = useRef(content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Memoize the onChange handler to prevent infinite loops
  const handleContentChange = useCallback((newContent: string) => {
    if (!isUpdatingRef.current && newContent !== lastContentRef.current) {
      isUpdatingRef.current = true
      lastContentRef.current = newContent
      onChange(newContent)
      // Reset the flag immediately after the update
      isUpdatingRef.current = false
    }
  }, [onChange])

  // Parse content on mount and when content prop changes
  useEffect(() => {
    if (isUpdatingRef.current) return // Skip if we're in the middle of updating
    
    if (content !== lastContentRef.current) {
      lastContentRef.current = content
      
      if (content) {
        try {
          // Try to parse as JSON (bullet/ordered list)
          const parsed = JSON.parse(content)
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].text) {
            // It's a structured list
            const text = parsed.map((item: any) => item.text).join('\n')
            setTextContent(text)
            setListType('bullet')
            return
          }
        } catch {
          // Not JSON, check if it's an ordered list
          if (content.match(/^\d+\.\s/m)) {
            const text = content.replace(/^\d+\.\s/gm, '')
            setTextContent(text)
            setListType('ordered')
            return
          }
          
          // If it's just plain text, remove bullet characters and set
          const plainText = content
            .replace(/^[•\-\*]\s*/gm, '') // Remove bullet characters
            .replace(/^\d+\.\s*/gm, '') // Remove ordered list numbers
          setTextContent(plainText)
          setListType('text')
        }
      } else {
        setTextContent('')
      }
    }
  }, [content])

  // Update content when text changes
  useEffect(() => {
    if (isUpdatingRef.current) return // Skip if we're in the middle of updating
    
    if (textContent.trim()) {
      if (listType === 'text') {
        // For normal text, just pass the content as is
        handleContentChange(textContent)
      } else {
        // For bullet/ordered lists, create structured format
        const lines = textContent
          .split('\n')
          .filter(line => line.trim())
          .map(line => line.trim())
        
        if (lines.length > 0) {
          const listItems = lines.map((line, index) => ({
            id: `item-${index}`,
            text: line
          }))
          
          const newContent = JSON.stringify(listItems)
          handleContentChange(newContent)
        } else {
          handleContentChange('')
        }
      }
    } else {
      handleContentChange('')
    }
  }, [textContent, listType, handleContentChange])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextContent(e.target.value)
  }

  const toggleListType = () => {
    if (listType === 'bullet') {
      setListType('ordered')
    } else if (listType === 'ordered') {
      setListType('text')
    } else {
      setListType('bullet')
    }
  }

  const clearContent = () => {
    setTextContent('')
    handleContentChange('')
  }

  const applyFormatting = (format: 'bold' | 'italic') => {
    if (!textareaRef.current) return
    
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textContent.substring(start, end)
    
    if (selectedText) {
      let formattedText = ''
      if (format === 'bold') {
        formattedText = `**${selectedText}**`
      } else if (format === 'italic') {
        formattedText = `*${selectedText}*`
      }
      
      const newText = textContent.substring(0, start) + formattedText + textContent.substring(end)
      setTextContent(newText)
      
      // Set cursor position after the formatted text
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(start + formattedText.length, start + formattedText.length)
        }
      }, 0)
    }
  }

  const getFormattedText = () => {
    if (!textContent.trim()) return ''
    
    // Function to render markdown formatting
    const renderMarkdown = (text: string) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold: **text** → <strong>text</strong>
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic: *text* → <em>text</em>
    }
    
    if (listType === 'text') {
      return renderMarkdown(textContent)
    }
    
    const lines = textContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.trim())
    
    if (listType === 'ordered') {
      return lines.map((line, index) => `${index + 1}. ${renderMarkdown(line)}`).join('\n')
    } else {
      return lines.map(line => `• ${renderMarkdown(line)}`).join('\n')
    }
  }

  const getTypeLabel = () => {
    switch (listType) {
      case 'bullet': return 'Bullet List'
      case 'ordered': return 'Ordered List'
      case 'text': return 'Normal Text'
      default: return 'Bullet List'
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </Label>
      )}
      
      {/* Unified Input Area with Live Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleListType}
              className="h-8 px-3 text-xs"
            >
              {listType === 'bullet' && <List className="w-3 h-3 mr-1" />}
              {listType === 'ordered' && <ListOrdered className="w-3 h-3 mr-1" />}
              {listType === 'text' && <Type className="w-3 h-3 mr-1" />}
              {getTypeLabel()}
            </Button>
            
            {/* Text Formatting Controls */}
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyFormatting('bold')}
                className="h-8 w-8 p-0"
                title="Bold (Ctrl+B)"
              >
                <Bold className="w-3 h-3" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyFormatting('italic')}
                className="h-8 w-8 p-0"
                title="Italic (Ctrl+I)"
              >
                <Italic className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          {textContent.trim() && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearContent}
              className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
        
        {/* Live Preview Display */}
        {textContent.trim() && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 min-h-[100px]">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Live Preview:</div>
            <div 
              className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: getFormattedText() }}
            />
          </div>
        )}
        
        {/* Input Textarea */}
        <Textarea
          ref={textareaRef}
          value={textContent}
          onChange={handleTextChange}
          placeholder={placeholder}
          className="min-h-[100px] resize-none"
        />
        
        {/* Formatting Instructions */}
        <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-2 rounded">
          <p><strong>Formatting:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Select text and click <strong>B</strong> for <strong>bold</strong></li>
            <li>Select text and click <em>I</em> for <em>italic</em></li>
            <li>Use <code>**text**</code> for bold or <code>*text*</code> for italic</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
