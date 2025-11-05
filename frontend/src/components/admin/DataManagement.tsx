import React, { useState, useRef } from 'react'
import { Download, Upload, Loader, CheckCircle, AlertCircle, X } from '@/components/icons'
import { api } from '../../utils/api'

interface DataManagementProps {
  onImportComplete?: () => void
}

export const DataManagement: React.FC<DataManagementProps> = ({ onImportComplete }) => {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<{
    success: number
    failed: number
    errors?: string[]
  } | null>(null)
  const [showImportStatus, setShowImportStatus] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const data = await api.cafes.export()

      // Create blob and download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cafes-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      alert(`Export failed: ${(error as Error).message}`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsImporting(true)
      setImportStatus(null)
      setShowImportStatus(false)

      // Read file
      const text = await file.text()
      const data = JSON.parse(text)

      // Validate format
      if (!data.cafes || !Array.isArray(data.cafes)) {
        throw new Error('Invalid file format: must contain a "cafes" array')
      }

      // Import via API
      const result = await api.cafes.import(data)
      setImportStatus(result)
      setShowImportStatus(true)

      // Notify parent to refresh data
      if (onImportComplete) {
        onImportComplete()
      }
    } catch (error) {
      alert(`Import failed: ${(error as Error).message}`)
    } finally {
      setIsImporting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Export/Import Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export */}
        <div className="bg-white rounded-lg shadow-xs p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Download size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Export Data</h3>
              <p className="text-xs text-gray-600">Download all cafes as JSON</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader className="animate-spin" size={16} />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Export All Cafes
              </>
            )}
          </button>
        </div>

        {/* Import */}
        <div className="bg-white rounded-lg shadow-xs p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Upload size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Import Data</h3>
              <p className="text-xs text-gray-600">Upload JSON file to import</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={handleImportClick}
            disabled={isImporting}
            className="w-full px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isImporting ? (
              <>
                <Loader className="animate-spin" size={16} />
                Importing...
              </>
            ) : (
              <>
                <Upload size={16} />
                Import Cafes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Import Status Modal */}
      {showImportStatus && importStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xs max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Import Results</h3>
                <button
                  onClick={() => setShowImportStatus(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                  <div>
                    <div className="text-2xl font-bold text-green-800">{importStatus.success}</div>
                    <div className="text-sm text-green-700">Imported</div>
                  </div>
                </div>
                <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 flex items-center gap-3">
                  <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
                  <div>
                    <div className="text-2xl font-bold text-red-800">{importStatus.failed}</div>
                    <div className="text-sm text-red-700">Failed</div>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {importStatus.errors && importStatus.errors.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Errors:</h4>
                  <div className="bg-red-50 border border-red-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                      {importStatus.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setShowImportStatus(false)}
                className="w-full px-4 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2 text-sm">How to Use:</h4>
        <ul className="list-disc list-inside space-y-1 text-xs text-blue-800">
          <li><strong>Export:</strong> Download all cafes and drinks in JSON format for backup or editing</li>
          <li><strong>Import:</strong> Upload a JSON file to bulk create or update cafes</li>
          <li>Existing cafes (matched by Google Maps link) will be updated with new data</li>
          <li>New cafes will be created automatically</li>
          <li>Import will enrich cafes with Google Maps data when available</li>
        </ul>
      </div>
    </div>
  )
}

export default DataManagement
