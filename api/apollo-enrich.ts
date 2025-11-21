import type { VercelRequest, VercelResponse } from '@vercel/node';

const APOLLO_ENDPOINT = 'https://api.apollo.io/v1/contacts/search';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing APOLLO_API_KEY environment variable' });
  }

  const { company, domain } = req.body || {};
  if (!company) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  try {
    const response = await fetch(APOLLO_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        q_organization_name: company,
        organization_domains: domain ? [domain] : undefined,
        person_titles: ['Owner', 'Founder', 'CEO', 'President', 'Managing Director'],
        page: 1,
        limit: 1
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || response.statusText || 'Apollo enrichment failed'
      });
    }

    const contact = Array.isArray(data?.contacts) ? data.contacts[0] : null;
    return res.status(200).json({ contact });
  } catch (error: any) {
    console.error('Apollo enrichment error', error);
    return res.status(500).json({ error: 'Apollo enrichment request failed' });
  }
}

