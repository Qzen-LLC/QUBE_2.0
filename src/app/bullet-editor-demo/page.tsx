'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { EnhancedRichTextEditor } from '@/components/ui/enhanced-rich-text-editor'
import { BulletListEditor } from '@/components/ui/bullet-list-editor'
import { SimpleBulletEditor } from '@/components/ui/simple-bullet-editor'

export default function BulletEditorDemo() {
  const [content1, setContent1] = useState('')
  const [content2, setContent2] = useState('')
  const [content3, setContent3] = useState('')
  const [content4, setContent4] = useState('')

  const sampleBulletContent = [
    { id: '1', text: 'Improved efficiency and productivity' },
    { id: '2', text: 'Cost reduction through automation' },
    { id: '3', text: 'Better decision making with data insights' },
    { id: '4', text: 'Enhanced customer experience' }
  ]

  const sampleHtmlContent = `<ul><li>Improved efficiency and productivity</li><li>Cost reduction through automation</li><li>Better decision making with data insights</li><li>Enhanced customer experience</li></ul>`

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Bullet List Editor Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          This page demonstrates different approaches to implementing bullet list functionality. 
          Choose the approach that works best for your use case.
        </p>
      </div>

      <Tabs defaultValue="enhanced" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="enhanced">Enhanced Rich Text</TabsTrigger>
          <TabsTrigger value="bullet">Bullet List Editor</TabsTrigger>
          <TabsTrigger value="simple">Simple Bullet Editor</TabsTrigger>
          <TabsTrigger value="original">Original Rich Text</TabsTrigger>
        </TabsList>

        <TabsContent value="enhanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enhanced Rich Text Editor</CardTitle>
              <CardDescription>
                Smart editor that automatically detects content type and provides mode switching
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Key Benefits</Label>
                <EnhancedRichTextEditor
                  content={content1}
                  onChange={setContent1}
                  placeholder="Describe the key benefits of your solution..."
                  label="Key Benefits"
                  mode="auto"
                />
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium mb-2">Raw Content:</h4>
                <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                  {content1 || 'No content yet'}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bullet" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bullet List Editor</CardTitle>
              <CardDescription>
                Interactive bullet list editor with drag-and-drop reordering
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Success Criteria</Label>
                <BulletListEditor
                  content={content2}
                  onChange={setContent2}
                  placeholder="Define what success looks like..."
                  label="Success Criteria"
                />
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium mb-2">Raw Content:</h4>
                <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                  {content2 || 'No content yet'}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simple" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Simple Bullet Editor</CardTitle>
              <CardDescription>
                Textarea-based editor with live preview and automatic bullet formatting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Problem Statement</Label>
                <SimpleBulletEditor
                  content={content3}
                  onChange={setContent3}
                  placeholder="Describe the problem you're solving..."
                  label="Problem Statement"
                />
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium mb-2">Raw Content:</h4>
                <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                  {content3 || 'No content yet'}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="original" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Original Rich Text Editor</CardTitle>
              <CardDescription>
                Standard TipTap editor (may have bullet list issues)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Proposed AI Solution</Label>
                <RichTextEditor
                  content={content4}
                  onChange={setContent4}
                  placeholder="Describe your proposed AI solution..."
                  className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
                />
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium mb-2">Raw Content:</h4>
                <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                  {content4 || 'No content yet'}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sample Data Section */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Data</CardTitle>
          <CardDescription>
            Use these sample data formats to test the editors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">JSON Format:</h4>
              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                {JSON.stringify(sampleBulletContent, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-medium mb-2">HTML Format:</h4>
              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                {sampleHtmlContent}
              </pre>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setContent1(JSON.stringify(sampleBulletContent))}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Load Sample in Enhanced Editor
            </button>
            <button
              onClick={() => setContent2(JSON.stringify(sampleBulletContent))}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              Load Sample in Bullet Editor
            </button>
            <button
              onClick={() => setContent3(JSON.stringify(sampleBulletContent))}
              className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Load Sample in Simple Editor
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
          <CardDescription>
            Choose the right editor based on your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Enhanced Rich Text Editor</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Best for: Mixed content with both rich text and bullet points. Automatically detects content type.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Bullet List Editor</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Best for: Pure bullet point lists with drag-and-drop reordering and individual item editing.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Simple Bullet Editor</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Best for: Simple bullet points with live preview. Most reliable and lightweight.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
