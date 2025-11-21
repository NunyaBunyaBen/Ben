import React from 'react';
import { FileCode2, Shield, Download, Terminal, Cloud, AlertTriangle } from 'lucide-react';

const EnvRow: React.FC<{ label: string; value: string; secret?: boolean }> = ({ label, value, secret }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs uppercase text-zinc-500 font-bold">{label}</span>
    <code className="bg-black/60 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 font-mono overflow-x-auto">
      {secret ? '••••••••••••••••••••••••••••••' : value}
    </code>
  </div>
);

export const EnvironmentGuide: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <FileCode2 size={30} className="text-nb-teal" /> Environment Setup
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Store API keys and secrets safely in your local `.env.local` file and mirrored in Vercel’s environment settings.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <Shield size={16} /> Never commit secrets to git.
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Terminal size={18} className="text-nb-pink" /> Local `.env.local`
          </div>
          <p className="text-sm text-zinc-400">
            Create <code>.env.local</code> in the project root. Vite automatically exposes variables prefixed
            with <code>VITE_</code> to the browser.
          </p>
          <div className="grid gap-3">
            <EnvRow label="VITE_SUPABASE_URL" value="https://dqxwrhxablsioztsyshr.supabase.co" />
            <EnvRow label="VITE_SUPABASE_ANON_KEY" value="YOUR_ANON_KEY" secret />
            <EnvRow label="SUPABASE_SERVICE_KEY" value="Server-side only key" secret />
<EnvRow label="APOLLO_API_KEY" value="Secret Apollo access token" secret />
          </div>
          <div className="text-xs text-zinc-500 border border-dashed border-zinc-700 rounded-lg p-3">
            Tip: duplicate the same values in `.env.production` or Vercel Project Settings → Environment Variables.
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Cloud size={18} className="text-nb-teal" /> Vercel Project Settings
          </div>
          <p className="text-sm text-zinc-400">
            Go to <strong>Vercel → {`Project > Settings > Environment Variables`}</strong> and add the same keys for
            Production/Preview/Development. Redeploy after saving.
          </p>
          <ol className="list-decimal list-inside text-sm text-zinc-300 space-y-1">
            <li>Add <code>VITE_SUPABASE_URL</code> with your project URL.</li>
            <li>Add <code>VITE_SUPABASE_ANON_KEY</code>.</li>
            <li>Add <code>SUPABASE_SERVICE_KEY</code> (only if you run server-side scripts).</li>
            <li>Redeploy or run <code>vercel --prod</code>.</li>
          </ol>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Download size={14} /> Keep a secure copy of your keys (1Password, Bitwarden, etc.).
          </div>
        </div>
      </section>

      <section className="bg-black/40 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-lg">
          <Cloud size={18} className="text-nb-pink" /> Supabase Table
        </div>
        <p className="text-sm text-zinc-400">
          Add a lightweight key/value table so the app can store JSON blobs remotely. Run this SQL in
          Supabase SQL Editor:
        </p>
        <pre className="bg-black/60 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-200 overflow-x-auto">
{`create table if not exists app_state (
  id text primary key,
  data jsonb,
  updated_at timestamptz default now()
);

alter table app_state enable row level security;
create policy "Allow anon read/write"
  on app_state
  for all
  using (true)
  with check (true);`}
        </pre>
        <p className="text-xs text-zinc-500">
          You can tighten the RLS policy later by scoping to authenticated users.
        </p>
      </section>

      <section className="bg-black/40 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-lg">
          <AlertTriangle size={18} className="text-yellow-400" /> Common Pitfalls
        </div>
        <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1">
          <li><strong>Never commit</strong> `.env.local` or hard-code secrets: git history is forever.</li>
          <li>Ensure <code>.env.local</code> exists before running <code>npm run dev</code>, otherwise Supabase client setup will throw.</li>
          <li>Anon keys go to the browser (read-only). Service keys stay server-side or in automation scripts only.</li>
          <li>When rotating keys, update both local `.env` and Vercel, then redeploy.</li>
        </ul>
      </section>
    </div>
  );
};

