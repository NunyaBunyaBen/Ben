import React, { useState } from 'react'
import {
  LayoutDashboard,
  Scale,
  CheckSquare,
  Target,
  Users,
  Calendar,
  Trophy,
  Activity,
  DollarSign,
  BarChart3
} from 'lucide-react'

// Import components
import Dashboard from './components/Dashboard'
import LegalDemands from './components/LegalDemands'
import Tasks from './components/Tasks'
import Goals from './components/Goals'
import Clients from './components/Clients'
import ContentCalendar from './components/ContentCalendar'
import Opportunities from './components/Opportunities'
import Habits from './components/Habits'
import Finance from './components/Finance'
import Analytics from './components/Analytics'

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard')

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'legal', name: 'Legal Demands', icon: Scale },
    { id: 'tasks', name: 'Tasks', icon: CheckSquare },
    { id: 'goals', name: 'Goals', icon: Target },
    { id: 'clients', name: 'Clients', icon: Users },
    { id: 'content', name: 'Content', icon: Calendar },
    { id: 'opportunities', name: 'Opportunities', icon: Trophy },
    { id: 'habits', name: 'Habits', icon: Activity },
    { id: 'finance', name: 'Finance', icon: DollarSign },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
  ]

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />
      case 'legal': return <LegalDemands />
      case 'tasks': return <Tasks />
      case 'goals': return <Goals />
      case 'clients': return <Clients />
      case 'content': return <ContentCalendar />
      case 'opportunities': return <Opportunities />
      case 'habits': return <Habits />
      case 'finance': return <Finance />
      case 'analytics': return <Analytics />
      default: return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gray-900 border-r border-gray-800">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <h1 className="text-2xl font-bold text-white">BEN HQ</h1>
            <p className="text-sm text-gray-400 mt-1">Life Operating System</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    currentView === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </button>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <div className="px-4 py-2 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400">Version 1.0</p>
              <p className="text-sm text-white">Ben's Command Center</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 min-h-screen">
        <div className="p-8">
          {renderView()}
        </div>
      </div>
    </div>
  )
}
