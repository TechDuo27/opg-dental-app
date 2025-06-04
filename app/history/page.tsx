// app/history/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import AuthWrapper from "@/components/AuthWrapper"
import { Calendar, FileText, ArrowLeft } from "lucide-react"

interface AnalysisRecord {
  id: string
  original_image_url: string
  detections: any[]
  total_detections: number
  analysis_date: string
  created_at: string
}

function HistoryContent() {
  const router = useRouter()
  const [history, setHistory] = useState<AnalysisRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setHistory(data || [])
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadAll = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Create HTML report
      const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>OPG Analysis History - ${new Date().toLocaleDateString()}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { text-align: center; margin-bottom: 30px; }
    h1 { color: #2563eb; }
    .scan { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
    .detection { margin: 5px 0; padding: 8px; background: #f5f5f5; border-radius: 4px; }
    .high { background: #fee2e2; }
    .medium { background: #fef3c7; }
    .low { background: #d1fae5; }
  </style>
</head>
<body>
  <div class="header">
    <h1>OPG Analysis History Report</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>
  
  <h2>Summary</h2>
  <p>Total Scans: ${history.length}</p>
  <p>Total Issues Detected: ${history.reduce((acc, item) => acc + (item.total_detections || 0), 0)}</p>
  
  <h2>Detailed History</h2>
  ${history.map((record, idx) => `
    <div class="scan">
      <h3>Scan ${history.length - idx} - ${formatDate(record.created_at)}</h3>
      <p>Conditions detected: ${record.total_detections || 0}</p>
      ${record.detections && record.detections.length > 0 ? 
        record.detections.map((d: any) => `
          <div class="detection ${d.confidence > 0.8 ? 'high' : d.confidence > 0.6 ? 'medium' : 'low'}">
            ${d.label} - ${(d.confidence * 100).toFixed(0)}%
          </div>
        `).join('') : '<p>No issues detected</p>'
      }
    </div>
  `).join('')}
</body>
</html>`

      const blob = new Blob([reportHTML], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `OPG-History-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading scans:', error)
      alert('Failed to download scans')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSeverityColor = (detections: any[]) => {
    if (!detections || detections.length === 0) return 'bg-green-100 text-green-700'
    
    const hasHighConfidence = detections.some(d => d.confidence > 0.8)
    if (hasHighConfidence) return 'bg-red-100 text-red-700'
    
    const hasMediumConfidence = detections.some(d => d.confidence > 0.6)
    if (hasMediumConfidence) return 'bg-yellow-100 text-yellow-700'
    
    return 'bg-green-100 text-green-700'
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analysis History</h1>
                <p className="text-gray-600 mt-1">Track your dental health journey</p>
              </div>
            </div>
            {history.length > 0 && (
              <button 
                onClick={handleDownloadAll}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Download All Scans
              </button>
            )}
          </div>
        </div>

        {/* History List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Analysis History</h3>
            <p className="text-gray-500 mb-6">You haven't analyzed any X-rays yet.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Analyze Your First X-Ray
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {history.map((record) => (
              <div key={record.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {formatDate(record.analysis_date || record.created_at)}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <h3 className="font-semibold text-lg mb-1">
                        Analysis Results
                      </h3>
                      <p className="text-gray-600">
                        {record.total_detections} condition{record.total_detections !== 1 ? 's' : ''} detected
                      </p>
                    </div>

                    {record.detections && record.detections.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {record.detections.map((detection, idx) => (
                          <span
                            key={idx}
                            className={`text-xs px-2 py-1 rounded-full ${getSeverityColor([detection])}`}
                          >
                            {detection.label} ({(detection.confidence * 100).toFixed(0)}%)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    {record.original_image_url && (
                      <img
                        src={record.original_image_url}
                        alt="X-Ray thumbnail"
                        className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default function HistoryPage() {
  return (
    <AuthWrapper>
      <HistoryContent />
    </AuthWrapper>
  )
}