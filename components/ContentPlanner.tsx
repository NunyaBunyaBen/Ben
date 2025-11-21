import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../DataContext';
import { DEFAULT_CONTENT_BASKETS } from '../constants';
import { ClientContentPlan, ContentPlanBasketSelection } from '../types';
import { Calendar as CalendarIcon, ClipboardCheck, Trash2 } from 'lucide-react';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const defaultPlan = (clientId?: string): ClientContentPlan => ({
  clientId: clientId || '',
  startDate: new Date().toISOString().split('T')[0],
  weeks: 4,
  postingDays: ['Mon', 'Wed', 'Fri'],
  basketSelections: DEFAULT_CONTENT_BASKETS.map(b => ({
    basketId: b.id,
    frequencyPerWeek: b.cadencePerWeek
  }))
});

const ContentPlanner: React.FC = () => {
  const { clients, contentPlans, saveContentPlan, deleteContentPlan } = useData();
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [plan, setPlan] = useState<ClientContentPlan>(defaultPlan(clients[0]?.id));
  const activePlan = contentPlans[clientId];
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    if (contentPlans[clientId]) {
      setPlan(contentPlans[clientId]);
    } else {
      setPlan(defaultPlan(clientId));
    }
  }, [clientId, contentPlans]);

  const handleBasketFrequency = (basketId: string, freq: number) => {
    setPlan(prev => ({
      ...prev,
      basketSelections: prev.basketSelections.map(sel =>
        sel.basketId === basketId ? { ...sel, frequencyPerWeek: freq } : sel
      )
    }));
  };

  const plannedSchedule = useMemo(() => {
    if (!plan.startDate) return [];
    const start = new Date(plan.startDate);
    const schedule: Array<{
      date: string;
      weekday: string;
      basketId: string;
    }> = [];

    const buckets = plan.basketSelections.flatMap(sel => {
      const basket = DEFAULT_CONTENT_BASKETS.find(b => b.id === sel.basketId);
      if (!basket || sel.frequencyPerWeek <= 0) return [];
      return new Array(sel.frequencyPerWeek).fill(basket.id);
    });

    if (buckets.length === 0) return schedule;

    let bucketIndex = 0;

    for (let week = 0; week < plan.weeks; week++) {
      WEEKDAYS.forEach(day => {
        if (!plan.postingDays.includes(day)) return;
        const current = new Date(start);
        current.setDate(current.getDate() + week * 7);
        const currentWeekday = current.getDay(); // 0=Sun
        const targetIndex = WEEKDAYS.indexOf(day);
        const offset = ((targetIndex - ((currentWeekday + 6) % 7)) + 7) % 7; // convert JS day to Mon=0
        current.setDate(current.getDate() + offset);
        schedule.push({
          date: current.toISOString().split('T')[0],
          weekday: day,
          basketId: buckets[bucketIndex % buckets.length]
        });
        bucketIndex++;
      });
    }

    return schedule.sort((a, b) => a.date.localeCompare(b.date));
  }, [plan]);

  const handleSave = async () => {
    if (!clientId) return;
    setIsSaving(true);
    await saveContentPlan({ ...plan, clientId });
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!clientId) return;
    if (window.confirm('Remove content plan for this client?')) {
      await deleteContentPlan(clientId);
      setPlan(defaultPlan(clientId));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <CalendarIcon size={30} className="text-nb-pink" /> Content Planner
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Map recurring content baskets to posting days so production stays aligned with strategy.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="bg-black border border-zinc-800 text-sm text-white rounded-lg px-3 py-2"
          >
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={isSaving || !clientId}
            className="bg-nb-teal text-black font-bold px-4 py-2 rounded-md hover:bg-teal-400 transition disabled:opacity-40 flex items-center gap-2"
          >
            <ClipboardCheck size={16} /> Save Plan
          </button>
          {activePlan && (
            <button
              onClick={handleDelete}
              className="text-zinc-500 hover:text-red-500 flex items-center gap-1 text-sm font-bold"
            >
              <Trash2 size={16} /> Remove
            </button>
          )}
        </div>
      </header>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Cadence & Weeks</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">Start Date</label>
                <input
                  type="date"
                  className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm text-white"
                  value={plan.startDate}
                  onChange={(e) => setPlan(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">Duration (weeks)</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm text-white"
                  value={plan.weeks}
                  onChange={(e) => setPlan(prev => ({ ...prev, weeks: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">Posting Days</label>
                <div className="flex flex-wrap gap-1">
                  {WEEKDAYS.map(day => (
                    <button
                      key={day}
                      onClick={() =>
                        setPlan(prev => ({
                          ...prev,
                          postingDays: prev.postingDays.includes(day)
                            ? prev.postingDays.filter(d => d !== day)
                            : [...prev.postingDays, day]
                        }))
                      }
                      className={`px-2 py-1 text-xs rounded border ${
                        plan.postingDays.includes(day)
                          ? 'bg-nb-pink/20 border-nb-pink text-white'
                          : 'bg-black border-zinc-800 text-zinc-500'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-2">Content Baskets</h3>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {DEFAULT_CONTENT_BASKETS.map(basket => {
                const selection = plan.basketSelections.find(sel => sel.basketId === basket.id) as ContentPlanBasketSelection | undefined;
                const freq = selection?.frequencyPerWeek ?? 0;
                return (
                  <div key={basket.id} className="border border-zinc-800 rounded-xl p-4 bg-black/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">{basket.name}</p>
                        <p className="text-xs text-zinc-500">{basket.theme}</p>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={7}
                        value={freq}
                        onChange={(e) => handleBasketFrequency(basket.id, Number(e.target.value))}
                        className="w-16 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white text-center"
                      />
                    </div>
                    <p className="text-xs text-zinc-400">{basket.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {basket.pillars.map(pillar => (
                        <span key={pillar} className="px-2 py-0.5 text-[10px] border border-zinc-800 rounded-full text-zinc-400">
                          {pillar}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Auto-Generated Schedule</h3>
              <p className="text-xs text-zinc-500">Each slot pulls a prompt from the assigned basket.</p>
            </div>
          </div>

          {plannedSchedule.length === 0 ? (
            <div className="text-sm text-zinc-500 border border-dashed border-zinc-800 rounded-lg p-6 text-center">
              Select a start date, posting days, and basket cadence to preview the plan.
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto pr-1 max-h-[520px]">
              {plannedSchedule.map((entry, idx) => {
                const basket = DEFAULT_CONTENT_BASKETS.find(b => b.id === entry.basketId);
                if (!basket) return null;
                const prompt = basket.prompts[idx % basket.prompts.length];
                return (
                  <div key={`${entry.date}-${entry.weekday}`} className="border border-zinc-800 rounded-xl p-4 bg-black/30">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-white">{entry.weekday} • {entry.date}</p>
                        <p className="text-xs text-zinc-500">{basket.name}</p>
                      </div>
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded-full border border-nb-pink/40 text-nb-pink">
                        {basket.theme}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300 mt-2">{prompt}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ContentPlanner;

