import React, { useState, useCallback } from 'react'
import { Upload, File, X } from 'lucide-react'

interface UploadZoneProps {
  label: string
  accept?: string
  multiple?: boolean
  onFilesChange?: (files: File[]) => void
}

export function UploadZone({ label, accept, multiple = false, onFilesChange }: UploadZoneProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    const newFiles = multiple ? [...files, ...droppedFiles] : [droppedFiles[0]]
    setFiles(newFiles)
    onFilesChange?.(newFiles)
  }, [files, multiple, onFilesChange])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      const newFiles = multiple ? [...files, ...selectedFiles] : [selectedFiles[0]]
      setFiles(newFiles)
      onFilesChange?.(newFiles)
    }
  }

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onFilesChange?.(newFiles)
  }

  return (
    <div>
      <label className="block mb-2">{label}</label>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed p-12 text-center transition-colors ${
          isDragging ? 'border-[#0A0A0A] bg-[#F5F0DC]' : 'border-[#CCCCCC]'
        }`}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-[#555555]" />
        <p className="text-[#1A1A1A] mb-2">Drag and drop files here or click to browse</p>
        <p className="text-sm text-[#555555] font-mono uppercase tracking-wider">
          {accept || 'All file types'}
        </p>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          id={`upload-${label.replace(/\s+/g, '-')}`}
        />
        <label
          htmlFor={`upload-${label.replace(/\s+/g, '-')}`}
          className="inline-block mt-4 px-6 py-2 border border-[#0A0A0A] cursor-pointer hover:bg-[#F5F0DC]"
        >
          Select Files
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between border border-[#CCCCCC] p-3 bg-white"
            >
              <div className="flex items-center gap-3">
                <File className="w-5 h-5 text-[#555555]" />
                <span className="font-mono text-sm">{file.name}</span>
                <span className="text-xs text-[#555555]">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <button onClick={() => removeFile(index)} className="p-1 hover:bg-[#F5F0DC]">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
