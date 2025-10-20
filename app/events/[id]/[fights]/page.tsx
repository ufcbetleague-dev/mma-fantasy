'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

interface Fight {
  id: string
  fighter_a: string
  fighter_b: string
  weight_class: string
  odds_a?: number
  odds_b?: number
  winner?: string | null
}

export default function FightsPage() {
  const { id } = useParams()
  const [fights, setFights] = useState<Fight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
console.log('Event ID from params:', id)
    const loadFights = async () => {
      const { data, error } = await supabase
        .from('fights')
        .select('*')
        .eq('event_id', id)
        .order('id', { ascending: true })

      if (error) {
        console.error('❌ Error loading fights:', error)
      } else {
        setFights(data || [])
      }

      setLoading(false)
    }

    loadFights()
  }, [id])

  if (loading) return <p className="p-6 text-center">Loading fights...</p>

  if (fights.length === 0)
    return <p className="p-6 text-center text-gray-400">No fights found.</p>

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-center mb-4">Fight Card</h1>

      {fights.map((fight) => (
        <div
          key={fight.id}
          className="bg-gray-900 border border-gray-700 rounded-xl p-4"
        >
          <p className="text-lg font-semibold">
            {fight.fighter_a} <span className="text-red-400">vs</span> {fight.fighter_b}
          </p>
          <p className="text-sm text-gray-400">{fight.weight_class}</p>
          {fight.winner && (
            <p className="text-green-400 text-sm mt-2">
              Winner: {fight.winner}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
