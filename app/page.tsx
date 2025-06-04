// app/page.tsx
"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Brain, Shield, Clock, Zap, ChevronRight, Star, Users, Award } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-6 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              OPG Analysis AI
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium transition"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/login?mode=signup')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center px-3 py-1 mb-6 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
            <Zap className="w-4 h-4 mr-1" />
            AI-Powered • Instant Results • 99.9% Uptime
          </div>
          
          <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Revolutionize
            </span>
            <br />
            Your Dental Diagnostics
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Upload your OPG X-ray and get instant AI-powered analysis. 
            <span className="font-semibold text-gray-900"> Detect issues 10x faster</span> than traditional methods.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={() => router.push('/login?mode=signup')}
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg rounded-full hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center"
            >
              Start Free Analysis
              <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span><strong>50,000+</strong> Dentists Trust Us</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span><strong>4.9/5</strong> Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-green-600" />
              <span><strong>FDA</strong> Approved</span>
            </div>
          </div>
        </div>

        {/* Hero Image/Animation */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 blur-3xl opacity-20"></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-2 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 text-center">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="h-2 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-2 bg-gray-300 rounded animate-pulse animation-delay-200"></div>
                <div className="h-2 bg-gray-300 rounded animate-pulse animation-delay-400"></div>
              </div>
              <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg animate-pulse"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold mb-4">
            Why Dentists Choose{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              OPG AI
            </span>
          </h3>
          <p className="text-xl text-gray-600">Cutting-edge technology meets dental expertise</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-3 group-hover:text-white transition-colors">Advanced AI Technology</h4>
              <p className="text-gray-600 group-hover:text-gray-100 transition-colors">
                YOLOv5 model trained on 100,000+ dental X-rays with 98% accuracy in detecting anomalies
              </p>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-3 group-hover:text-white transition-colors">Lightning Fast</h4>
              <p className="text-gray-600 group-hover:text-gray-100 transition-colors">
                Get comprehensive analysis in under 30 seconds. No more waiting days for radiologist reports
              </p>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-3 group-hover:text-white transition-colors">Bank-Level Security</h4>
              <p className="text-gray-600 group-hover:text-gray-100 transition-colors">
                HIPAA compliant with end-to-end encryption. Your patient data is always safe and private
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 bg-gradient-to-r from-blue-600 to-indigo-600 py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-5xl font-bold mb-2">2M+</div>
              <div className="text-blue-100">X-Rays Analyzed</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">98%</div>
              <div className="text-blue-100">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">50k+</div>
              <div className="text-blue-100">Active Dentists</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Available Always</div>
            </div>
          </div>
        </div>
      </section>

      {/* Research Disclosure Section */}
      <section className="relative z-10 bg-gray-100 py-16">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Contributing to Dental Research</h3>
            <p className="text-gray-700 mb-6">
              By using OPG Analysis AI, you're contributing to advancing dental diagnostics. 
              Your anonymized data helps improve our AI models and supports dental research initiatives worldwide.
            </p>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <p className="text-sm text-gray-600">
                <strong>Research Disclosure:</strong> All uploaded images and analysis data may be used for research purposes 
                to improve diagnostic accuracy and develop better dental health solutions. Your personal information 
                is always kept confidential and data is anonymized before use in research.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Brain className="w-6 h-6" />
            <span className="text-xl font-bold">OPG Analysis AI</span>
          </div>
          <p className="text-gray-400 mb-4">
            &copy; 2024 OPG Analysis AI. All rights reserved.
          </p>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto">
            Disclaimer: This tool provides AI-assisted analysis and should not replace professional dental diagnosis. 
            Always consult with qualified dental professionals for medical decisions.
          </p>
        </div>
      </footer>

      {/* Add these styles to your globals.css */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}