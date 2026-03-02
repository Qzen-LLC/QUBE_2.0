'use client'

import React, { useState, useEffect } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BulletListEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  label?: string
}

interface BulletItem {
  id: string
  text: string
}

export function BulletListEditor({ 
  content, 
  onChange, 
  placeholder = "Add bullet points...", 
  className,
  label 
}: BulletListEditorProps) {
  const [items, setItems] = useState<BulletItem[]>([])
  const [newItemText, setNewItemText] = useState('')

  // Parse content on mount and when content prop changes
  useEffect(() => {
    if (content) {
      try {
        // Try to parse as JSON first (for structured data)
        const parsed = JSON.parse(content)
        if (Array.isArray(parsed)) {
          setItems(parsed)
          return
        }
      } catch {
        // If not JSON, try to parse HTML-like content
        const htmlContent = content
        if (htmlContent.includes('<ul>') || htmlContent.includes('<li>')) {
          // Extract text from HTML-like content
          const textContent = htmlContent
            .replace(/<ul[^>]*>/g, '')
            .replace(/<\/ul>/g, '')
            .replace(/<li[^>]*>/g, '')
            .replace(/<\/li>/g, '\n')
            .trim()
          
          if (textContent) {
            const bulletItems = textContent
              .split('\n')
              .filter(line => line.trim())
              .map((line, index) => ({
                id: `item-${Date.now()}-${index}`,
                text: line.trim()
              }))
            setItems(bulletItems)
            return
          }
        }
        
        // If it's just plain text, split by newlines or bullet characters
        const plainText = content
          .replace(/^[•\-\*]\s*/gm, '') // Remove bullet characters
          .split(/\n+/)
          .filter(line => line.trim())
          .map((line, index) => ({
            id: `item-${Date.now()}-${index}`,
            text: line.trim()
          }))
        setItems(plainText)
      }
    } else {
      setItems([])
    }
  }, [content])

  // Update content when items change
  useEffect(() => {
    const newContent = JSON.stringify(items)
    // Only call onChange if the content has actually changed
    if (newContent !== content) {
      onChange(newContent)
    }
  }, [items, onChange, content])

  const addItem = () => {
    if (newItemText.trim()) {
      const newItem: BulletItem = {
        id: `item-${Date.now()}-${Math.random()}`,
        text: newItemText.trim()
      }
      setItems([...items, newItem])
      setNewItemText('')
    }
  }

  const updateItem = (id: string, text: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, text } : item
    ))
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const moveItem = (id: string, direction: 'up' | 'down') => {
    const currentIndex = items.findIndex(item => item.id === id)
    if (currentIndex === -1) return

    const newItems = [...items]
    if (direction === 'up' && currentIndex > 0) {
      [newItems[currentIndex], newItems[currentIndex - 1]] = [newItems[currentIndex - 1], newItems[currentIndex]]
    } else if (direction === 'down' && currentIndex < items.length - 1) {
      [newItems[currentIndex], newItems[currentIndex + 1]] = [newItems[currentIndex + 1], newItems[currentIndex]]
    }
    setItems(newItems)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      addItem()
    }
  }

  const getDisplayContent = () => {
    if (items.length === 0) return ''
    
    // Convert to HTML-like format for display
    const htmlContent = items
      .map(item => `<li>${item.text}</li>`)
      .join('')
    return `<ul>${htmlContent}</ul>`
  }

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      {/* Add new item */}
      <div className="flex gap-2">
        <Input
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={addItem}
          disabled={!newItemText.trim()}
          size="sm"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Bullet items */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2 group">
            <div className="flex-shrink-0 w-2 h-2 bg-gray-400 rounded-full"></div>
            <Input
              value={item.text}
              onChange={(e) => updateItem(item.id, e.target.value)}
              className="flex-1 border-0 shadow-none focus-visible:ring-1 focus-visible:ring-blue-500"
              placeholder="Enter bullet point text..."
            />
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => moveItem(item.id, 'up')}
                disabled={index === 0}
                className="h-6 w-6 p-0"
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => moveItem(item.id, 'down')}
                disabled={index === items.length - 1}
                className="h-6 w-6 p-0"
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(item.id)}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Hidden input for form submission */}
      <input 
        type="hidden" 
        value={getDisplayContent()} 
        onChange={() => {}} 
      />
    </div>
  )
}
