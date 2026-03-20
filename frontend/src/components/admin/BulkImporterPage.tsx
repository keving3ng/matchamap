import React, { useState } from 'react'
import { Upload, CheckCircle, AlertCircle, FileText, Loader, Download } from '@/components/icons'
import { parseCsvToCafes } from '../../utils/csvParser'
import { parseJsonToCafes } from '../../utils/jsonParser'
import { generateChangelog, type ImportChangelog } from '../../utils/importDiffEngine'
import { useDataStore } from '../../stores/dataStore'
import { api } from '../../utils/api'

type ImportMode = 'csv' | 'json'

export const BulkImporterPage: React.FC = () => {
  // Use selector to only subscribe to allCafes
  const allCafes = useDataStore((state) => state.allCafes)
  const fetchCafes = useDataStore((state) => state.fetchCafes)
  const [importMode, setImportMode] = useState<ImportMode>('csv')
  const [csvText, setCsvText] = useState('')
  const [jsonText, setJsonText] = useState('')
  const [changelog, setChangelog] = useState<ImportChangelog | null>(null)
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<{
    success: number
    failed: number
    message: string
  } | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const handleParse = () => {
    setParseErrors([])
    setChangelog(null)
    setExecutionResult(null)

    const { cafes, errors } = importMode === 'csv'
      ? parseCsvToCafes(csvText)
      : parseJsonToCafes(jsonText)

    if (errors.length > 0) {
      setParseErrors(errors)
      return
    }

    // Generate changelog by comparing against existing cafes
    const log = generateChangelog(cafes, allCafes)
    setChangelog(log)
  }

  const handleModeChange = (mode: ImportMode) => {
    setImportMode(mode)
    setParseErrors([])
    setChangelog(null)
    setExecutionResult(null)
  }

  const handleExecute = async () => {
    if (!changelog) return

    setIsExecuting(true)
    setExecutionResult(null)

    try {
      // Combine existing changes and new additions
      const cafesToImport = [
        ...changelog.existingChanges.map(c => c.cafe),
        ...changelog.newAdditions.map(c => c.cafe)
      ]

      // Call backend import endpoint
      const response = await api.cafes.import({
        cafes: cafesToImport as any // eslint-disable-line @typescript-eslint/no-explicit-any -- CsvCafe is compatible with Partial<Cafe> for import
      })

      setExecutionResult({
        success: response.success || 0,
        failed: response.failed || 0,
        message: response.message || 'Import completed'
      })

      // Refresh cafe data with cache busting
      await fetchCafes(undefined, true)

      // Clear changelog after successful import
      if (response.success > 0) {
        setChangelog(null)
        setCsvText('')
        setJsonText('')
      }
    } catch (error) {
      setExecutionResult({
        success: 0,
        failed: 0,
        message: `Import failed: ${(error as Error).message}`
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await api.cafes.export()

      // Convert to JSON and download
      const jsonString = JSON.stringify(response.cafes, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `matchamap-cafes-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert(`Export failed: ${(error as Error).message}`)
    } finally {
      setIsExporting(false)
    }
  }

  const totalChanges = changelog
    ? changelog.existingChanges.length + changelog.newAdditions.length
    : 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Bulk Import/Export</h1>
          <p className="text-gray-600">
            Import or update multiple cafes and drinks from a CSV spreadsheet, or export existing data
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
        >
          {isExporting ? (
            <>
              <Loader className="animate-spin" size={20} />
              Exporting...
            </>
          ) : (
            <>
              <Download size={20} />
              Export All Cafes
            </>
          )}
        </button>
      </div>

      {/* Import Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => handleModeChange('csv')}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            importMode === 'csv'
              ? 'bg-green-600 text-white shadow-xs'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          CSV Import
        </button>
        <button
          onClick={() => handleModeChange('json')}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            importMode === 'json'
              ? 'bg-green-600 text-white shadow-xs'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          JSON Import
        </button>
      </div>

      {/* Instructions */}
      {importMode === 'csv' ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">CSV Format Instructions</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Required headers:</strong> Name, Link (Google Maps URL), City, Quick Note, Drink Name, Score, Price</li>
            <li>• <strong>Optional headers:</strong> Ambiance, Review, Source, Instagram, IG Post Link, TikTok Post Link, Grams</li>
            <li>• Headers are case-insensitive (e.g., &quot;Name&quot; or &quot;name&quot; both work)</li>
            <li>• Slug, latitude, longitude will be auto-generated from the Google Maps link</li>
            <li>• Currency is auto-detected from city (Toronto/Montreal=CAD, NYC=USD)</li>
            <li>• One drink per row - multiple rows for same cafe = multiple drinks</li>
          </ul>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">JSON Format Instructions</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Paste JSON array of cafes (same format as exported from &quot;Export All Cafes&quot;)</li>
            <li>• Can be a plain array: <code className="bg-white px-1 rounded">{"[{...}, {...}]"}</code></li>
            <li>• Or wrapped: <code className="bg-white px-1 rounded">{'{cafes: [{...}, {...}]}'}</code></li>
            <li>• Each cafe must have: name, link, quickNote, and drinks array</li>
            <li>• Missing latitude/longitude will be fetched from Google Maps link</li>
            <li>• Great for bulk editing or re-importing exported data</li>
          </ul>
        </div>
      )}

      {/* Input */}
      <div className="bg-white rounded-lg shadow-xs p-6 mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {importMode === 'csv' ? 'Paste CSV Data' : 'Paste JSON Data'}
        </label>
        <textarea
          value={importMode === 'csv' ? csvText : jsonText}
          onChange={(e) => importMode === 'csv' ? setCsvText(e.target.value) : setJsonText(e.target.value)}
          placeholder={importMode === 'csv' ? 'Paste your CSV data here...' : 'Paste your JSON data here...'}
          className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />

        <button
          onClick={handleParse}
          disabled={importMode === 'csv' ? !csvText.trim() : !jsonText.trim()}
          className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
        >
          <FileText size={20} />
          Parse & Preview Changes
        </button>
      </div>

      {/* Parse Errors */}
      {parseErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-800 font-semibold mb-2">
            <AlertCircle size={20} />
            Parse Errors
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {parseErrors.map((error, idx) => (
              <li key={idx}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Execution Result */}
      {executionResult && (
        <div className={`border rounded-lg p-4 mb-6 ${
          executionResult.success > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className={`flex items-center gap-2 font-semibold mb-2 ${
            executionResult.success > 0 ? 'text-green-800' : 'text-red-800'
          }`}>
            {executionResult.success > 0 ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            Import Result
          </div>
          <p className={`text-sm ${executionResult.success > 0 ? 'text-green-700' : 'text-red-700'}`}>
            {executionResult.message}
          </p>
          {executionResult.success > 0 && (
            <p className="text-sm text-green-600 mt-1">
              ✅ Successfully imported {executionResult.success} cafe(s)
            </p>
          )}
          {executionResult.failed > 0 && (
            <p className="text-sm text-red-600 mt-1">
              ❌ Failed to import {executionResult.failed} cafe(s)
            </p>
          )}
        </div>
      )}

      {/* Changelog Preview */}
      {changelog && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-lg shadow-xs p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Import Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {changelog.existingChanges.length}
                </div>
                <div className="text-sm text-blue-700">Existing Updates</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {changelog.newAdditions.length}
                </div>
                <div className="text-sm text-green-700">New Additions</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {changelog.invalidEntries.length}
                </div>
                <div className="text-sm text-red-700">Cannot Add</div>
              </div>
            </div>
          </div>

          {/* Existing Changes */}
          {changelog.existingChanges.length > 0 && (
            <div className="bg-white rounded-lg shadow-xs p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle className="text-blue-600" size={20} />
                Existing Updates ({changelog.existingChanges.length})
              </h3>
              <div className="space-y-4">
                {changelog.existingChanges.map((change, idx) => (
                  <div key={idx} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="font-semibold text-gray-800 mb-2">
                      {change.cafe.name} ({change.cafe.slug})
                    </div>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {change.changes?.map((c, cidx) => (
                        <li key={cidx} className="flex items-start gap-2">
                          <span className="text-blue-600">→</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Additions */}
          {changelog.newAdditions.length > 0 && (
            <div className="bg-white rounded-lg shadow-xs p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle className="text-green-600" size={20} />
                New Additions ({changelog.newAdditions.length})
              </h3>
              <div className="space-y-4">
                {changelog.newAdditions.map((change, idx) => (
                  <div key={idx} className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="font-semibold text-gray-800 mb-2">
                      {change.cafe.name} ({change.cafe.slug})
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      📍 {change.cafe.city} • {change.cafe.drinks.length} drink(s)
                    </div>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {change.cafe.drinks.map((drink, didx) => (
                        <li key={didx}>
                          ☕ {drink.name} - {drink.score}/10 (${drink.priceAmount} {drink.priceCurrency})
                          {drink.isDefault && <span className="text-green-600 ml-2">★ Default</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invalid Entries */}
          {changelog.invalidEntries.length > 0 && (
            <div className="bg-white rounded-lg shadow-xs p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <AlertCircle className="text-red-600" size={20} />
                Cannot Add ({changelog.invalidEntries.length})
              </h3>
              <div className="space-y-4">
                {changelog.invalidEntries.map((entry, idx) => (
                  <div key={idx} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="font-semibold text-gray-800 mb-2">
                      {entry.cafe.name || 'Unknown'} ({entry.cafe.slug || 'no-slug'})
                    </div>
                    <ul className="text-sm text-red-700 space-y-1">
                      {entry.errors.map((error, eidx) => (
                        <li key={eidx}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Execute Button */}
          {totalChanges > 0 && (
            <div className="bg-white rounded-lg shadow-xs p-6">
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {isExecuting ? (
                  <>
                    <Loader className="animate-spin" size={24} />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload size={24} />
                    Execute Import ({totalChanges} change{totalChanges !== 1 ? 's' : ''})
                  </>
                )}
              </button>
              {changelog.invalidEntries.length > 0 && (
                <p className="text-sm text-gray-600 mt-3 text-center">
                  Note: {changelog.invalidEntries.length} invalid entr{changelog.invalidEntries.length !== 1 ? 'ies' : 'y'} will be skipped
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default BulkImporterPage
