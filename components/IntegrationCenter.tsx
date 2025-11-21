import React, { useState } from 'react';
import { useData } from '../DataContext';
import { CreditCard, Key, Shield, DollarSign, RefreshCcw, Trash2, Plus } from 'lucide-react';
import { IntegrationSubscription, ApiKeyEntry } from '../types';

const emptySubscription = (): Omit<IntegrationSubscription, 'id'> => ({
  provider: '',
  plan: '',
  cost: 0,
  billingCycle: 'Monthly',
  renewalDate: new Date().toISOString().split('T')[0],
  status: 'Active',
  seats: 1,
  notes: ''
});

const emptyApiKey = (): Omit<ApiKeyEntry, 'id' | 'createdAt'> => ({
  label: '',
  provider: '',
  key: '',
  status: 'active',
  notes: ''
});

const maskKey = (key: string) => {
  if (!key) return '';
  if (key.length <= 4) return key;
  const visible = key.slice(-4);
  return `${'•'.repeat(key.length - 4)}${visible}`;
};

export const IntegrationCenter: React.FC = () => {
  const { 
    subscriptions, apiKeys,
    addSubscription, updateSubscription, deleteSubscription,
    addApiKey, updateApiKey, deleteApiKey
  } = useData();

  const [subscriptionForm, setSubscriptionForm] = useState<Omit<IntegrationSubscription, 'id'>>(emptySubscription());
  const [apiKeyForm, setApiKeyForm] = useState<Omit<ApiKeyEntry, 'id' | 'createdAt'>>(emptyApiKey());
  const [isSavingSub, setIsSavingSub] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);

  const handleAddSubscription = async () => {
    if (!subscriptionForm.provider || !subscriptionForm.plan) return;
    setIsSavingSub(true);
    await addSubscription(subscriptionForm);
    setSubscriptionForm(emptySubscription());
    setIsSavingSub(false);
  };

  const handleAddApiKey = async () => {
    if (!apiKeyForm.provider || !apiKeyForm.label || !apiKeyForm.key) return;
    setIsSavingKey(true);
    await addApiKey(apiKeyForm);
    setApiKeyForm(emptyApiKey());
    setIsSavingKey(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Shield size={28} className="text-nb-teal" /> Integrations Hub
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Track subscriptions, renewal dates, and securely manage API keys for your automations.
          </p>
        </div>
      </div>
      <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 text-sm text-amber-100 space-y-1">
        <div className="flex items-center gap-2 font-bold text-amber-200">
          <DollarSign size={16} /> Apollo.io Credit Reminder
        </div>
        <p>
          Apollo only gives us <strong>100 enrichment credits per month</strong>. Each enriched contact consumes
          one credit, so run the agent only on priority prospects and avoid bulk reruns. Reset occurs on your
          Apollo billing cycle.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Subscription Manager */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex flex-col space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <CreditCard size={18} className="text-nb-pink" /> Subscriptions
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Monitor tools, renewal dates, and costs.</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase text-zinc-500">Monthly Spend</p>
              <p className="text-lg font-black text-nb-teal">
                $
                {subscriptions
                  .filter(sub => sub.status === 'Active')
                  .reduce((acc, sub) => acc + (sub.billingCycle === 'Annual' ? sub.cost / 12 : sub.billingCycle === 'Quarterly' ? sub.cost / 3 : sub.cost), 0)
                  .toFixed(0)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">Provider</label>
                <input
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-nb-pink outline-none"
                  placeholder="e.g. Zapier"
                  value={subscriptionForm.provider}
                  onChange={(e) => setSubscriptionForm({...subscriptionForm, provider: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">Plan</label>
                <input
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-nb-pink outline-none"
                  placeholder="Professional"
                  value={subscriptionForm.plan}
                  onChange={(e) => setSubscriptionForm({...subscriptionForm, plan: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1">
                  <DollarSign size={10}/> Cost
                </label>
                <input
                  type="number"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-nb-pink outline-none"
                  value={subscriptionForm.cost}
                  onChange={(e) => setSubscriptionForm({...subscriptionForm, cost: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">Billing Cycle</label>
                <select
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-nb-pink outline-none"
                  value={subscriptionForm.billingCycle}
                  onChange={(e) => setSubscriptionForm({...subscriptionForm, billingCycle: e.target.value as IntegrationSubscription['billingCycle']})}
                >
                  <option>Monthly</option>
                  <option>Quarterly</option>
                  <option>Annual</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">Renewal</label>
                <input
                  type="date"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-nb-pink outline-none"
                  value={subscriptionForm.renewalDate}
                  onChange={(e) => setSubscriptionForm({...subscriptionForm, renewalDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">Status</label>
                <select
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-nb-pink outline-none"
                  value={subscriptionForm.status}
                  onChange={(e) => setSubscriptionForm({...subscriptionForm, status: e.target.value as IntegrationSubscription['status']})}
                >
                  <option>Active</option>
                  <option>Paused</option>
                  <option>Canceled</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">Seats</label>
                <input
                  type="number"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-nb-pink outline-none"
                  value={subscriptionForm.seats}
                  onChange={(e) => setSubscriptionForm({...subscriptionForm, seats: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">Notes</label>
                <input
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-nb-pink outline-none"
                  placeholder="Usage, owners, etc."
                  value={subscriptionForm.notes}
                  onChange={(e) => setSubscriptionForm({...subscriptionForm, notes: e.target.value })}
                />
              </div>
            </div>
            <button
              onClick={handleAddSubscription}
              disabled={isSavingSub || !subscriptionForm.provider || !subscriptionForm.plan}
              className="w-full bg-nb-pink text-white font-bold py-2 rounded-md hover:bg-pink-600 transition disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Plus size={16}/> Add Subscription
            </button>
          </div>

          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {subscriptions.length === 0 && (
              <div className="text-sm text-zinc-500 border border-dashed border-zinc-800 rounded-lg p-4 text-center">
                No subscriptions yet. Add your first integration above.
              </div>
            )}
            {subscriptions.map(sub => (
              <div key={sub.id} className="border border-zinc-800 rounded-xl p-4 bg-black/30">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h4 className="font-bold text-white">{sub.provider}</h4>
                    <p className="text-xs text-zinc-500">{sub.plan} • {sub.billingCycle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={sub.status}
                      onChange={(e) => updateSubscription(sub.id, { status: e.target.value as IntegrationSubscription['status'] })}
                      className="bg-zinc-900 border border-zinc-800 text-xs font-bold rounded px-2 py-1 text-zinc-300"
                    >
                      <option>Active</option>
                      <option>Paused</option>
                      <option>Canceled</option>
                    </select>
                    <button
                      onClick={() => deleteSubscription(sub.id)}
                      className="text-zinc-500 hover:text-red-500"
                    >
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs text-zinc-400 mt-3">
                  <div>
                    <p className="uppercase text-[10px] text-zinc-500">Cost</p>
                    <p className="font-mono text-white">${sub.cost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="uppercase text-[10px] text-zinc-500">Renewal</p>
                    <p>{sub.renewalDate}</p>
                  </div>
                  <div>
                    <p className="uppercase text-[10px] text-zinc-500">Seats</p>
                    <p>{sub.seats || 1}</p>
                  </div>
                </div>
                {sub.notes && (
                  <p className="text-xs text-zinc-500 mt-3 italic">{sub.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* API Key Manager */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex flex-col space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Key size={18} className="text-nb-teal" /> API Keys
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Store and label credentials for automations.</p>
            </div>
            <div className="text-xs text-zinc-500 flex items-center gap-2">
              <Shield size={14}/> Stored locally
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">Provider</label>
                <input
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-nb-pink outline-none"
                  placeholder="e.g. OpenAI"
                  value={apiKeyForm.provider}
                  onChange={(e) => setApiKeyForm({...apiKeyForm, provider: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">Label</label>
                <input
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-nb-pink outline-none"
                  placeholder="Production Key"
                  value={apiKeyForm.label}
                  onChange={(e) => setApiKeyForm({...apiKeyForm, label: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">API Key</label>
                <input
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-nb-pink outline-none font-mono"
                  placeholder="sk-live-..."
                  value={apiKeyForm.key}
                  onChange={(e) => setApiKeyForm({...apiKeyForm, key: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">Status</label>
                <select
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-nb-pink outline-none"
                  value={apiKeyForm.status}
                  onChange={(e) => setApiKeyForm({...apiKeyForm, status: e.target.value as ApiKeyEntry['status']})}
                >
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase">Notes</label>
              <input
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-nb-pink outline-none"
                placeholder="Permissions, project, owner..."
                value={apiKeyForm.notes}
                onChange={(e) => setApiKeyForm({...apiKeyForm, notes: e.target.value})}
              />
            </div>
            <button
              onClick={handleAddApiKey}
              disabled={isSavingKey || !apiKeyForm.provider || !apiKeyForm.label || !apiKeyForm.key}
              className="w-full bg-nb-teal text-black font-bold py-2 rounded-md hover:bg-teal-400 transition disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Plus size={16}/> Save API Key
            </button>
          </div>

          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {apiKeys.length === 0 && (
              <div className="text-sm text-zinc-500 border border-dashed border-zinc-800 rounded-lg p-4 text-center">
                Store your first API key above so the team knows where everything lives.
              </div>
            )}
            {apiKeys.map(key => (
              <div key={key.id} className="border border-zinc-800 rounded-xl p-4 bg-black/30">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h4 className="font-bold text-white">{key.provider}</h4>
                    <p className="text-xs text-zinc-500">{key.label}</p>
                    {key.provider.toLowerCase().includes('apollo') && (
                      <p className="text-[11px] text-amber-300 mt-1">
                        Budget: 100 credits/month • keep usage tight.
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={key.status}
                      onChange={(e) => updateApiKey(key.id, { status: e.target.value as ApiKeyEntry['status'] })}
                      className="bg-zinc-900 border border-zinc-800 text-xs font-bold rounded px-2 py-1 text-zinc-300"
                    >
                      <option value="active">Active</option>
                      <option value="disabled">Disabled</option>
                    </select>
                    <button
                      onClick={() => deleteApiKey(key.id)}
                      className="text-zinc-500 hover:text-red-500"
                    >
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
                <div className="mt-3 text-sm font-mono bg-zinc-950 border border-zinc-800 rounded px-3 py-2 flex justify-between items-center">
                  <span>{maskKey(key.key)}</span>
                  <span className="text-[10px] uppercase text-zinc-600">Stored {new Date(key.createdAt).toLocaleDateString()}</span>
                </div>
                {key.notes && (
                  <p className="text-xs text-zinc-500 mt-3 italic">{key.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

