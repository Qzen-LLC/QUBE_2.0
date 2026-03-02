'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, File, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  label?: string;
  value: string[];
  onChange: (files: string[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSize?: number; // in MB
  disabled?: boolean;
  disableRemove?: boolean;
  className?: string;
  useCaseId?: string;
  frameworkType?: string; // 'eu-ai-act', 'iso-42001', 'uae-ai'
}

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

export function FileUpload({
  label = "Evidence Files",
  value = [],
  onChange,
  accept = ".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.xlsx,.xls",
  maxFiles = 5,
  maxSize = 10, // 10MB default
  disabled = false,
  disableRemove = false,
  className = "",
  useCaseId,
  frameworkType
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // Validate required props
    if (!useCaseId) {
      alert('Use case ID is required for file upload');
      return;
    }
    
    if (!frameworkType) {
      alert('Framework type is required for file upload');
      return;
    }
    
    const newFiles: File[] = [];
    
    // Validate files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Maximum size is ${maxSize}MB.`);
        continue;
      }
      
      // Check total number of files
      if (value.length + newFiles.length >= maxFiles) {
        alert(`Maximum ${maxFiles} files allowed.`);
        break;
      }
      
      newFiles.push(file);
    }
    
    if (newFiles.length === 0) return;
    
    setUploading(true);
    
    try {
      const uploadPromises = newFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('useCaseId', useCaseId);
        formData.append('frameworkType', frameworkType);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        
        const result = await response.json();
        return result.url;
      });
      
      const uploadedUrls = await Promise.all(uploadPromises);
      onChange([...value, ...uploadedUrls]);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeFile = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const getFileName = (url: string) => {
    return url.split('/').pop() || 'Unknown file';
  };

  const downloadFile = (url: string) => {
    // Step 1: Start download
    const link = document.createElement('a');
    link.href = url;
    link.download = getFileName(url);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Step 2: After 500ms, open file in new browser tab
    setTimeout(() => {
      window.open(url, '_blank');
    }, 500);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          {label}
        </label>
      )}
      
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragOver 
                            ? 'border-gray-400 bg-gray-50 dark:bg-gray-800' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
          className="hidden"
        />
        
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-blue-500 dark:text-blue-400 animate-spin mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-300">Uploading files...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
              Click to upload or drag and drop files here
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {accept.split(',').join(', ')} (max {maxSize}MB each, {maxFiles} files total)
            </p>
          </div>
        )}
      </div>
      
      {/* File List */}
      {value.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Uploaded Files ({value.length}/{maxFiles}):
          </h4>
          <div className="space-y-2">
            {value.map((fileUrl, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center gap-3">
                  <File className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-200 truncate max-w-[200px]">
                    {getFileName(fileUrl)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    // variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFile(fileUrl);
                    }}
                    className="h-8 w-8 p-0 text-white"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    title="Remove"
                    disabled={disableRemove}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}