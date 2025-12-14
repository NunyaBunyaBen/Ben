
import { NavItem, PageType, Client, KanbanColumn, KanbanItem, CalendarEvent, Prospect, PackageDefinition } from './types';
import { 
  LayoutDashboard, 
  DollarSign, 
  BookOpen, 
  Users, 
  Calendar, 
  Library, 
  BarChart3, 
  GraduationCap,
  UserCog,
  CreditCard,
  Target,
  Settings
} from 'lucide-react';

export const NAV_STRUCTURE: NavItem[] = [
  {
    id: 'dashboard',
    label: 'HQ Dashboard',
    icon: 'LayoutDashboard',
    type: PageType.DASHBOARD,
    description: 'Your Daily Command Center'
  },
  {
    id: 'legal-demand-writer',
    label: 'Legal Demand Writer',
    icon: 'Scale',
    type: PageType.LEGAL_DEMANDS,
    description: 'Draft, version, and export demand letters'
  },
  {
    id: 'offers',
    label: 'Offers & Pricing',
    icon: 'DollarSign',
    type: PageType.DOCUMENT,
    children: [
      { id: 'offers-main', label: '🔥 SET & FORGET (Main)', type: PageType.RESOURCE_GRID },
      { id: 'offers-addon', label: 'Add-On Services', type: PageType.RESOURCE_GRID },
      { id: 'offers-calc', label: 'Pricing Calculator', type: PageType.DOCUMENT },
      { id: 'offers-compare', label: 'Package Comparison', type: PageType.RESOURCE_GRID },
    ]
  },
  {
    id: 'ops',
    label: 'Operations Manual',
    icon: 'BookOpen',
    type: PageType.DOCUMENT,
    children: [
      { id: 'ops-master', label: '🎯 MASTER SOP', type: PageType.DOCUMENT },
      { id: 'ops-onboarding', label: 'Client Onboarding SOP', type: PageType.DOCUMENT },
      { id: 'ops-production', label: 'Monthly Production SOP', type: PageType.DOCUMENT },
      { id: 'ops-photo', label: 'Photoshoot SOP', type: PageType.DOCUMENT },
      { id: 'ops-video', label: 'Video Production SOP', type: PageType.DOCUMENT },
      { id: 'ops-content', label: 'Content Creation SOP', type: PageType.DOCUMENT },
      { id: 'ops-community', label: 'Community Management SOP', type: PageType.DOCUMENT },
      { id: 'ops-reporting', label: 'Reporting SOP', type: PageType.DOCUMENT },
    ]
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: 'Users',
    type: PageType.DATABASE,
    children: [
      { id: 'clients-active', label: 'Active Clients', type: PageType.DATABASE },
      { id: 'clients-onboard', label: 'Onboarding', type: PageType.DATABASE },
      { id: 'clients-churned', label: 'Churned', type: PageType.DATABASE },
      { id: 'clients-template', label: 'Client Template', type: PageType.DOCUMENT },
    ]
  },
  {
    id: 'content',
    label: 'Content Production',
    icon: 'Calendar',
    type: PageType.CALENDAR,
    children: [
      { id: 'content-monthly', label: 'Monthly Calendar', type: PageType.CALENDAR },
      { id: 'content-schedule', label: 'Photoshoot Schedule', type: PageType.CALENDAR },
      { id: 'content-pipeline', label: 'Video Pipeline', type: PageType.KANBAN },
      { id: 'content-approval', label: 'Content Approval Status', type: PageType.DOCUMENT },
    ]
  },
  {
    id: 'templates',
    label: 'Templates & Resources',
    icon: 'Library',
    type: PageType.RESOURCE_GRID,
    children: [
      { id: 'temp-caption', label: 'Caption Templates', type: PageType.RESOURCE_GRID },
      { id: 'temp-email', label: 'Email Templates', type: PageType.RESOURCE_GRID },
      { id: 'temp-contract', label: 'Contract Templates', type: PageType.RESOURCE_GRID },
      { id: 'temp-proposal', label: 'Proposal Template', type: PageType.RESOURCE_GRID },
      { id: 'temp-shotlist', label: 'Shot Lists by Industry', type: PageType.RESOURCE_GRID },
      { id: 'temp-hashtags', label: 'Hashtag Banks', type: PageType.RESOURCE_GRID },
    ]
  },
  {
    id: 'team',
    label: 'Team & VA Management',
    icon: 'UserCog',
    type: PageType.DOCUMENT,
    children: [
      { id: 'team-va-train', label: 'VA Training Docs', type: PageType.DOCUMENT },
      { id: 'team-va-tasks', label: 'VA Task Checklists', type: PageType.DOCUMENT },
      { id: 'team-va-review', label: 'VA Performance Reviews', type: PageType.DOCUMENT },
      { id: 'team-access', label: 'Access & Logins', type: PageType.DOCUMENT },
      { id: 'team-va-sop', label: 'SOPs for VAs', type: PageType.DOCUMENT },
    ]
  },
  {
    id: 'finance',
    label: 'Finance & Invoicing',
    icon: 'CreditCard',
    type: PageType.FINANCE_DASHBOARD,
    children: [
      { id: 'fin-dashboard', label: 'Finance Command', type: PageType.FINANCE_DASHBOARD },
      { id: 'fin-invoice', label: 'Invoice Generator', type: PageType.INVOICE_GENERATOR },
      { id: 'fin-tax', label: 'Tax Documents', type: PageType.RESOURCE_GRID },
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics & Reports',
    icon: 'BarChart3',
    type: PageType.ANALYTICS,
    children: [
      { id: 'ana-perf', label: 'Client Performance', type: PageType.ANALYTICS },
      { id: 'ana-rev', label: 'Revenue Reports', type: PageType.ANALYTICS },
      { id: 'ana-time', label: 'Time Tracking', type: PageType.DOCUMENT },
    ]
  },
  {
    id: 'learning',
    label: 'Learning & Growth',
    icon: 'GraduationCap',
    type: PageType.DOCUMENT,
    children: [
      { id: 'learn-skills', label: 'Skills to Master', type: PageType.DOCUMENT },
      { id: 'learn-tools', label: 'Tool Tutorials', type: PageType.DOCUMENT },
      { id: 'learn-research', label: 'Industry Research', type: PageType.DOCUMENT },
      { id: 'learn-competitor', label: 'Competitor Analysis', type: PageType.DOCUMENT },
    ]
  },
  {
    id: 'outreach-dashboard',
    label: 'Growth & Outreach HQ',
    icon: 'Target',
    type: PageType.OUTREACH_DASHBOARD,
    description: 'YOUR #1 PRIORITY',
    children: [
      { id: 'outreach-home', label: "🎯 Today's Dashboard", type: PageType.OUTREACH_DASHBOARD },
      { id: 'outreach-db', label: '📋 Prospect Database', type: PageType.PROSPECT_DB },
      { id: 'outreach-scorecard', label: '📈 Weekly Scorecard', type: PageType.DOCUMENT },
      { id: 'outreach-cal', label: '📅 Outreach Calendar', type: PageType.CALENDAR },
      { id: 'outreach-templates', label: '💬 Message Templates', type: PageType.TEMPLATES },
      { id: 'outreach-funnel', label: '🏆 Conversion Tracker', type: PageType.FUNNEL },
      { id: 'sales-discovery', label: '📞 Discovery Call Script', type: PageType.DOCUMENT },
      { id: 'sales-proposal-gen', label: '📄 Proposal Generator', type: PageType.DOCUMENT },
      { id: 'sales-cases', label: '🏆 Case Studies', type: PageType.RESOURCE_GRID },
    ]
  },
  {
    id: 'settings',
    label: 'Settings & Backup',
    icon: 'Settings',
    type: PageType.SETTINGS
  }
];

export const INITIAL_CLIENTS: Client[] = [
  { id: '1', name: 'Neon Burger', status: 'Active', revenue: 5000, nextShoot: '2024-06-15', contact: 'mike@neonburger.com', package: 'Set & Forget' },
  { id: '2', name: 'Cyber Gym', status: 'Active', revenue: 3500, nextShoot: '2024-06-18', contact: 'sarah@cybergym.io', package: 'Starter Pack' },
  { id: '3', name: 'VaporWave Cafe', status: 'Onboarding', revenue: 2000, nextShoot: 'TBD', contact: 'alex@vapor.wave', package: 'Set & Forget' },
  { id: '4', name: 'Retro Autos', status: 'Churned', revenue: 0, nextShoot: 'N/A', contact: 'dave@retro.com', package: 'Add-on' },
  { id: '5', name: 'Future Tech', status: 'Lead', revenue: 0, nextShoot: 'N/A', contact: 'ceo@future.tech', package: 'Consulting' },
];

export const INITIAL_PROSPECTS: Prospect[] = [
  { id: 'p1', company: 'Apex Fitness', contactName: 'John Smith', industry: 'Fitness', platform: 'Instagram', status: 'Contacted', interest: 'Warm', lastContact: '2024-06-10', nextFollowUp: '2024-06-13', notes: 'Liked their recent post about new equipment. Sent DM Template 1.' },
  { id: 'p2', company: 'Golden Tooth Dental', contactName: 'Dr. Sarah', industry: 'Dental', platform: 'LinkedIn', status: 'Responded', interest: 'Hot', lastContact: '2024-06-11', nextFollowUp: '2024-06-12', notes: 'Asked about pricing. Sent calendar link.' },
];

export const INITIAL_CONTENT = {
  'outreach-templates': {
    id: 'outreach-templates',
    text: "# 💬 MESSAGE TEMPLATES\n\n## 📱 LINKEDIN CONNECTION REQUESTS\n\n### Template 1: Local Business Angle\nHi [Name],\nNoticed you're building [Company] here in Brisbane.\nI help local businesses create premium content that actually drives customers (the kind that makes people stop scrolling).\nWould love to connect!\nBen\n\n### Template 2: Industry-Specific\nHi [Name],\nFellow Brisbane business owner here. I work with [industry] businesses like yours to create social media content that converts.\nSaw [Company] and thought we should connect.\nBen\n\n---\n\n## 💬 LINKEDIN FIRST MESSAGE (After Connection)\n\n### Template 1: Discovery\nThanks for connecting, [Name]!\nQuick question - are you happy with how [Company]'s social media is performing?\nI help Brisbane businesses create premium content consistently.\nWhat's your biggest challenge with social media right now?\n\n### Template 2: Value First\nHey [Name],\nTook a quick look at [Company]'s Instagram - you're doing some things really well! \nI notice [specific observation]. Mind if I share a couple quick ideas that could help?\n(No pitch, just genuinely think I can help)\n\n---\n\n## 📸 INSTAGRAM DMs\n\n### Template 1: Genuine Compliment\nHey [Name]!\nJust came across [Company] and had to reach out - [specific genuine compliment about their business].\nAs someone who creates content for Brisbane businesses, I'm always keeping an eye out for cool brands. You're doing something special 🔥\n\n### Template 2: Value Offer (If They Respond)\nI actually specialize in creating premium content for [industry] businesses here in Brisbane.\nWould you be open to me doing a quick audit of your Instagram? I notice a few opportunities that could help you get more [bookings/customers].\nNo cost, no obligation - just want to help.",
    files: []
  },
  'offers-main': {
    id: 'offers-main',
    text: "# 🔥 SET & FORGET MAIN OFFER\n\n## Core Deliverables\n- 4 High-Quality Reels / Month\n- 20 Professional Photos\n- Community Management (1hr/week)\n- Monthly Strategy Call\n\n## The Pricing\n**Price:** $2,997/mo\n**Commitment:** 3 Month Minimum\n\n## The Pitch Script\n\"Most business owners spend 10 hours a week on social media for zero return. Our Set & Forget system completely removes that burden. We handle strategy, shooting, editing, and posting. You just approve the content and watch the leads come in.\"\n\n## Objection Handlers\n**'It's too expensive'** -> \"Compared to hiring a full-time content creator ($5k/mo), this is half the cost for a full team's output.\"\n**'Can we try 1 month?'** -> \"Strategy takes time to build momentum. We need 90 days to prove the ROI data.\"",
    files: []
  },
  'offers-addon': {
    id: 'offers-addon',
    text: "# 🚀 ADD-ON SERVICES\n\n## 📱 Story Management\nDaily story posting to keep engagement high.\n**Price:** $500/mo\n\n## 🎥 Extra Reel Pack\n4 Additional Reels per month.\n**Price:** $1,200/mo\n\n## 📈 Ads Management\nMeta Ads setup & monitoring (ad spend separate).\n**Price:** $1,500/mo",
    files: []
  },
  'offers-compare': {
    id: 'offers-compare',
    text: "# ⚖️ PACKAGE COMPARISON\n\n## Set & Forget (Recommended)\n**$2,997/mo**\n- Full Done-For-You\n- 4 Reels + 20 Photos\n- Strategy + Reporting\n\n## Starter Pack\n**$1,500/mo**\n- 2 Reels + 10 Photos\n- No Community Mgmt\n- Basic Reporting\n\n## Enterprise\n**$5,000/mo**\n- 8 Reels + 40 Photos\n- Weekly Meetings\n- Ads Management Included",
    files: []
  },
  'temp-shotlist': {
    id: 'temp-shotlist',
    text: "# 📸 SHOT LISTS BY INDUSTRY\n\n## 🍔 Restaurant (15 Shots)\n1. Hero shot of signature dish (top down)\n2. Chef plating food (action)\n3. Bartender shaking cocktail\n4. Pouring shot (drink/sauce)\n5. Friends laughing at table (lifestyle)\n6. Close up of texture (cheese pull/fizz)\n7. Exterior of venue (day & night)\n8. Interior ambiance (wide)\n9. Detail of decor/lighting\n10. Staff smiling at camera\n\n## 🦷 Dental Practice (15 Shots)\n1. Dentist talking to patient (smiling)\n2. Close up of tools (clean/sterile)\n3. Patient walking into reception\n4. Receptionist on phone\n5. Branding on wall/signage\n6. Before/After smile (if allowed)\n7. Team huddle\n8. Doctor looking at x-ray\n9. Handing patient a mirror\n10. 'Thumbs up' from patient",
    files: []
  },
  'temp-hashtags': {
    id: 'temp-hashtags',
    text: "# #️⃣ HASHTAG BANKS\n\n## Local Business (General)\n#BrisbaneBusiness #BrisbaneSmallBusiness #SupportLocalBrisbane #BrisbaneLife #BNE #QLDBusiness\n\n## Hospitality / Food\n#BrisbaneEats #BrisbaneFoodie #BrisbaneCafes #FoodStagram #Yum #DinnerTime #ChefLife #EatLocal\n\n## Real Estate\n#RealEstateAu #DreamHome #PropertyMarket #JustListed #HomeSweetHome #InvestmentProperty #RealtorLife",
    files: []
  },
  'temp-contract': {
    id: 'temp-contract',
    text: "# 📝 CONTRACT TEMPLATES\n\n## Service Agreement\nThis is the standard agreement for ongoing monthly retainers.\n\n**Key Clauses:**\n- 3 Month Minimum Term\n- 30 Day Cancellation Notice\n- IP Ownership transfers upon payment\n\n[Attach your PDF template here]\n\n## Non-Disclosure Agreement (NDA)\nUse this when working with sensitive client data or unreleased products.\n\n## Contractor Agreement\nFor hiring VAs or freelance photographers.\nIncludes 'Work for Hire' clause.",
    files: []
  },
  'sales-cases': {
    id: 'sales-cases',
    text: "# 🏆 CLIENT WINS\n\n## Neon Burger\n**Result:** +45% Walk-in Traffic\n**Strategy:** Local Reels Strategy\n[Attach Case Study PDF]\n\n## Cyber Gym\n**Result:** 20 New Members in 30 Days\n**Strategy:** Member Spotlight Series",
    files: []
  },
  'sales-discovery': {
    id: 'sales-discovery',
    text: "# 📞 DISCOVERY CALL SCRIPT\n\n## Phase 1: Rapport (2 mins)\n- \"Thanks for jumping on. I've been looking forward to this.\"\n- \"I saw your recent post about [Topic] - how's that going?\"\n\n## Phase 2: The Problem (5 mins)\n- \"What made you want to chat with me today?\"\n- \"What's the biggest bottleneck with your content right now?\"\n\n## Phase 3: The Solution (Pitch)\n- \"Based on what you said, I recommend our Set & Forget system...\"",
    files: []
  }
};

export const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'scripting', title: '📝 Scripting' },
  { id: 'shooting', title: '📸 Ready to Shoot' },
  { id: 'editing', title: '🎬 Editing' },
  { id: 'review', title: '👀 Client Review' },
  { id: 'done', title: '✅ Scheduled/Posted' }
];

export const INITIAL_KANBAN_ITEMS: KanbanItem[] = [
  { id: 'k1', title: 'Reel: Day in Life', client: 'Neon Burger', status: 'scripting' },
  { id: 'k2', title: 'Story: Q&A Session', client: 'Cyber Gym', status: 'scripting' },
  { id: 'k3', title: 'Photos: New Menu', client: 'Neon Burger', status: 'shooting', tag: 'Urgent' },
  { id: 'k4', title: 'Reel: 3 Tips', client: 'Crypto Law', status: 'shooting' },
  { id: 'k5', title: 'Vlog: Week 1', client: 'Personal Brand', status: 'editing' },
  { id: 'k6', title: 'Carousel: Market Update', client: 'Real Estate', status: 'review' },
  { id: 'k7', title: 'Reel: Intro', client: 'Zen Spa', status: 'done' }
];

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  { id: 'e1', title: 'Shoot @ Neon Burger', date: '2024-06-15', type: 'shoot', client: 'Neon Burger' },
  { id: 'e2', title: 'Shoot @ Cyber Gym', date: '2024-06-18', type: 'shoot', client: 'Cyber Gym' },
];

export const INITIAL_OUTREACH_EVENTS: CalendarEvent[] = [
  { id: 'oe1', title: 'Follow up: Golden Tooth', date: '2024-06-12', type: 'followup', client: 'Golden Tooth' },
  { id: 'oe2', title: 'Discovery Call: Sushi Train', date: '2024-06-15', type: 'meeting', client: 'Sushi Train' },
  { id: 'oe3', title: 'Morning Outreach Block', date: '2024-06-12', type: 'outreach', client: 'Self' },
  { id: 'oe4', title: 'Afternoon Outreach Block', date: '2024-06-12', type: 'outreach', client: 'Self' },
];

export const DEFAULT_PACKAGES: PackageDefinition[] = [
  {
    id: 'pkg-set-forget',
    name: 'Set & Forget',
    description: 'Full-service content engine (4 reels + 20 photos per month)',
    price: 2997,
    tasks: [
      { id: 'task-sf-kickoff', title: 'Kickoff Strategy Call', type: 'meeting', offsetDays: 0 },
      { id: 'task-sf-shoot', title: 'Monthly Shoot Day', type: 'shoot', offsetDays: 7 },
      { id: 'task-sf-review', title: 'Content Approval Session', type: 'post', offsetDays: 10 },
      { id: 'task-sf-report', title: 'Performance Report Delivery', type: 'meeting', offsetDays: 25 }
    ]
  },
  {
    id: 'pkg-starter',
    name: 'Starter Pack',
    description: 'Lite package for new clients (2 shoots + 1 report)',
    price: 1500,
    tasks: [
      { id: 'task-starter-strategy', title: 'Onboarding & Strategy', type: 'meeting', offsetDays: 0 },
      { id: 'task-starter-shoot', title: 'Shoot Sprint', type: 'shoot', offsetDays: 5 },
      { id: 'task-starter-delivery', title: 'Asset Delivery + Recap', type: 'post', offsetDays: 12 }
    ]
  },
  {
    id: 'pkg-enterprise',
    name: 'Enterprise Accelerator',
    description: 'Weekly shoots & aggressive reporting cadence',
    price: 5000,
    tasks: [
      { id: 'task-ent-kickoff', title: 'Executive Alignment Call', type: 'meeting', offsetDays: 0 },
      { id: 'task-ent-week1', title: 'Week 1 Shoot', type: 'shoot', offsetDays: 3 },
      { id: 'task-ent-week2', title: 'Week 2 Shoot', type: 'shoot', offsetDays: 10 },
      { id: 'task-ent-week3', title: 'Week 3 Review', type: 'meeting', offsetDays: 17 },
      { id: 'task-ent-report', title: 'Monthly ROI Review', type: 'meeting', offsetDays: 27 }
    ]
  }
];

export const DEFAULT_CONTENT_BASKETS = [
  {
    id: 'basket-authority',
    name: 'Authority Builder',
    theme: 'Educate & Earn Trust',
    description: 'Thought-leadership pillars showcasing expertise',
    cadencePerWeek: 2,
    pillars: ['How-To', 'Playbooks', 'Frameworks'],
    prompts: [
      'Share a 3-step breakdown of your signature process',
      'Teach a “mistakes to avoid” lesson from a recent client story',
      'Record a Loom explaining a trending topic in your niche'
    ]
  },
  {
    id: 'basket-demand',
    name: 'Demand Driver',
    theme: 'Show the outcome & transformation',
    description: 'Social proof, client stories, ROI snapshots',
    cadencePerWeek: 2,
    pillars: ['Case Studies', 'Testimonials', 'Before/After'],
    prompts: [
      'Publish a stat-driven win: “How we delivered X in 30 days”',
      'Share a screen recording walking through analytics',
      'Highlight a client quote with a punchy hook'
    ]
  },
  {
    id: 'basket-community',
    name: 'Community + BTS',
    theme: 'Personality, BTS, life-as-founder',
    description: 'Human content that builds connection and retention',
    cadencePerWeek: 1,
    pillars: ['Behind the Scenes', 'Values', 'Founder POV'],
    prompts: [
      'Post a “day-in-the-life” carousel or reel',
      'Share lessons from a recent challenge',
      'Showcase team culture or client collaboration',
    ]
  }
];

export const ROOT_FOLDERS = [
  '01_Brand Assets',
  '02_Content Bank',
  '03_Monthly Content',
  '04_Strategy & Reports',
  '05_Client Communications'
];

export const STRUCTURE_TEMPLATES: Record<string, string[]> = {
  '01_Brand Assets': ['01_Logo_Files', '02_Brand_Fonts', '03_Brand_Colors', '04_Brand_Guidelines'],
  '02_Content Bank': ['01_Photos', '02_Videos', '03_Graphics', '04_Raw_Footage'],
  '03_Monthly Content': ['2025', '2026'],
  '04_Strategy & Reports': ['01_Monthly_Reports', '02_Meeting_Notes', '03_Competitor_Analysis'],
  '05_Client Communications': ['01_Contracts', '02_Invoices', '03_Emails']
};

export const MONTHS_LIST = [
  '01_January', '02_February', '03_March', '04_April', '05_May', '06_June',
  '07_July', '08_August', '09_September', '10_October', '11_November', '12_December'
];

export const MONTHLY_TEMPLATE = ['01_Content_Calendar', '02_Captions', '03_Video_Scripts', '04_Finals_Posted', '05_Approval_Deck'];
