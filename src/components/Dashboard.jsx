import React from 'react'
import { Calendar, CheckSquare, DollarSign, Target, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Command Center</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="October Revenue" 
          value="$8,000" 
          target="/ $10,000"
          icon={DollarSign}
          color="bg-green-600"
        />
        <StatCard 
          title="Tasks Today" 
          value="4" 
          target="/ 12 complete"
          icon={CheckSquare}
          color="bg-blue-600"
        />
        <StatCard 
          title="Current Streak" 
          value="7 days" 
          target="Longest: 14"
          icon={TrendingUp}
          color="bg-purple-600"
        />
        <StatCard 
          title="Active Clients" 
          value="4" 
          target="Target: 12"
          icon={Target}
          color="bg-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Today's Priorities</h2>
          <div className="space-y-3">
            <PriorityItem priority="high" text="Finish automation (saves 26 hrs/month)" />
            <PriorityItem priority="high" text="ASAP video edit" />
            <PriorityItem priority="medium" text="Send quotes to Kallum & Gerry" />
            <PriorityItem priority="low" text="Dad's social content" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Upcoming Deadlines</h2>
          <div className="space-y-3">
            <DeadlineItem date="Today" text="ASAP video delivery" />
            <DeadlineItem date="Tomorrow" text="Kallum follow-up call" />
            <DeadlineItem date="Wed" text="Monthly finances review" />
            <DeadlineItem date="Thu" text="Doomsday doc interview" />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, target, icon: Icon, color }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
      <p className="text-sm text-gray-400">{title}</p>
      {target && <p className="text-xs text-gray-500 mt-1">{target}</p>}
    </div>
  )
}

function PriorityItem({ priority, text }) {
  const colors = {
    high: 'bg-red-600',
    medium: 'bg-yellow-600',
    low: 'bg-gray-600'
  }
  
  return (
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${colors[priority]}`} />
      <p className="text-gray-300">{text}</p>
    </div>
  )
}

function DeadlineItem({ date, text }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-gray-300">{text}</p>
      <span className="text-sm text-gray-500">{date}</span>
    </div>
  )
}
