// app/profile/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import AuthWrapper from "@/components/AuthWrapper"
import { ArrowLeft, User, Mail, Calendar, Activity, Save, Camera } from "lucide-react"

interface UserProfile {
  id: string
  name: string
  age: number
  sex: string
  smoking_status: string | null
  created_at: string
}

function ProfileContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [email, setEmail] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    sex: "",
    smoking_status: ""
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setEmail(user.email || "")

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (data) {
        setProfile(data)
        setFormData({
          name: data.name,
          age: data.age.toString(),
          sex: data.sex,
          smoking_status: data.smoking_status || ""
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_profiles')
        .update({
          name: formData.name,
          age: parseInt(formData.age),
          sex: formData.sex,
          smoking_status: formData.smoking_status || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadAllScans = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all analysis history
      const { data: history, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (!history || history.length === 0) {
        alert('No scans found to download')
        return
      }

      // Create HTML report
      const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Complete OPG Analysis History - ${new Date().toLocaleDateString()}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; line-height: 1.6; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
    .header h1 { color: #2563eb; margin-bottom: 10px; }
    .patient-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .scan-entry { margin-bottom: 40px; page-break-inside: avoid; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; }
    .scan-header { background: #2563eb; color: white; padding: 10px 20px; margin: -20px -20px 20px -20px; border-radius: 8px 8px 0 0; }
    .detection { margin: 10px 0; padding: 10px; background: #f0f0f0; border-radius: 5px; }
    .high { border-left: 4px solid #dc2626; }
    .medium { border-left: 4px solid #d97706; }
    .low { border-left: 4px solid #059669; }
    .summary { background: #e8f4f8; padding: 20px; border-radius: 8px; margin-top: 30px; }
    .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; }
    @media print { .scan-entry { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Complete OPG Analysis History</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>

  <div class="patient-info">
    <h2>Patient Information</h2>
    <p><strong>Name:</strong> ${profile?.name || 'N/A'}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Total Scans:</strong> ${history.length}</p>
    <p><strong>Period:</strong> ${history[history.length-1] ? new Date(history[history.length-1].created_at).toLocaleDateString() : 'N/A'} 
       to ${history[0] ? new Date(history[0].created_at).toLocaleDateString() : 'N/A'}</p>
  </div>

  ${history.map((scan, index) => `
    <div class="scan-entry">
      <div class="scan-header">
        <h3>Scan #${history.length - index} - ${new Date(scan.created_at).toLocaleString()}</h3>
      </div>
      
      <p><strong>Total Conditions Detected:</strong> ${scan.total_detections || 0}</p>
      
      ${scan.detections && scan.detections.length > 0 ? `
        <h4>Detected Conditions:</h4>
        ${scan.detections.map((d: any) => `
          <div class="detection ${
            d.confidence > 0.8 ? 'high' : d.confidence > 0.6 ? 'medium' : 'low'
          }">
            <strong>${d.label}</strong> - Confidence: ${(d.confidence * 100).toFixed(1)}%
            ${d.confidence > 0.8 ? ' (High Priority)' : d.confidence > 0.6 ? ' (Medium Priority)' : ' (Low Priority)'}
          </div>
        `).join('')}
      ` : '<p>No conditions detected in this scan.</p>'}
    </div>
  `).join('')}

  <div class="summary">
    <h2>Summary Statistics</h2>
    <p><strong>Total Scans Performed:</strong> ${history.length}</p>
    <p><strong>Total Issues Detected:</strong> ${history.reduce((acc, scan) => acc + (scan.total_detections || 0), 0)}</p>
    <p><strong>Average Issues per Scan:</strong> ${(history.reduce((acc, scan) => acc + (scan.total_detections || 0), 0) / history.length).toFixed(1)}</p>
  </div>

  <div class="footer">
    <p>This report is generated by OPG Analysis AI System</p>
    <p>For medical decisions, please consult with a qualified dental professional</p>
  </div>
</body>
</html>
      `

      // Download as HTML
      const blob = new Blob([reportHTML], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `OPG-Analysis-Complete-History-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading scans:', error)
      alert('Failed to download scans')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600 mt-1">Manage your account information</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-xl font-semibold">{formData.name}</h2>
                <p className="text-gray-600">{email}</p>
                
                <div className="mt-6 space-y-3 text-left">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      Joined {profile ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{formData.age} years old</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-semibold mb-6">Personal Information</h3>
              
              <form className="space-y-6" onSubmit={(e) => { 
                e.preventDefault(); 
                handleSave(); 
              }}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                      value={email}
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Biological Sex
                    </label>
                    <select
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.sex}
                      onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                    >
                      <option value="">Select...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Smoking Status
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.smoking_status}
                      onChange={(e) => setFormData({ ...formData, smoking_status: e.target.value })}
                    >
                      <option value="">Prefer not to say</option>
                      <option value="never">Never smoked</option>
                      <option value="former">Former smoker</option>
                      <option value="current">Current smoker</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Additional Settings */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
              <h3 className="text-xl font-semibold mb-6">Privacy & Security</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Download All Scans</h4>
                    <p className="text-sm text-gray-600">Get a copy of all your X-ray analyses</p>
                  </div>
                  <button 
                    onClick={handleDownloadAllScans}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function ProfilePage() {
  return (
    <AuthWrapper>
      <ProfileContent />
    </AuthWrapper>
  )
}