export type TenantAppGuideSection = {
  id: string;
  title: string;
  summary: string;
  steps: string[];
  tips?: string[];
};

export const TENANT_APP_GUIDE = {
  title: 'CROSSUB Tenant App — User Guide',
  subtitle: 'Manage your tenancy from move-in to move-out',
  versionLabel: 'August 2026',
  intro:
    'The CROSSUB Tenant app is your single place to view your lease, pay rent, report repairs, complete inspections, message your property manager, and manage move-in and move-out. This guide walks through each part of the app in the order most tenants use it.',
  sections: [
    {
      id: 'sign-in',
      title: '1. Sign in & first steps',
      summary:
        'Your property manager sends tenant login credentials after your lease is set up. Use that email and password on the sign-in screen.',
      steps: [
        'Open the CROSSUB Tenant app and tap Sign in.',
        'Enter the email and password your agent provided.',
        'Complete any welcome or onboarding prompts on first login.',
        'If you forget your password, tap Forgot password? or contact your property manager.',
        'Browse listings without signing in if you are still looking for a rental.',
      ],
      tips: [
        'This app is for tenants only — staff accounts use the CROSSUB admin portal.',
        'If no property appears after sign-in, ask your agent to resend tenant credentials from your approved application.',
      ],
    },
    {
      id: 'home',
      title: '2. Home dashboard',
      summary:
        'Home shows your tenancy at a glance — urgent actions, property summary, repairs, accounting, and messages.',
      steps: [
        'Welcome card — your name and property address when a lease is linked.',
        'Action required — ingoing/outgoing inspections, rent reviews, completion approvals, and end-of-lease tasks.',
        'Your tenancy — quick links to Property, Inspection, Repair, Accounting, and Messages.',
        'Tap any card to open the full screen for that area.',
      ],
    },
    {
      id: 'property',
      title: '3. Property & lease',
      summary:
        'The Property tab shows your address, rent, key dates, and links to your lease documents.',
      steps: [
        'Open Property from the bottom navigation or Home.',
        'View weekly rent, lease start and end dates, and renewal reminders.',
        'Open My lease for tenancy agreement PDFs and lease status.',
        'Find all documents under Documents in the menu — receipts, bond proofs, and statements.',
      ],
    },
    {
      id: 'onboarding',
      title: '4. Applying & move-in',
      summary:
        'New tenants apply from Browse listings, then complete onboarding before move-in is official.',
      steps: [
        'Browse listings → open a property → submit an application when enabled.',
        'Track application status under Applications in the menu.',
        'After approval, complete the onboarding checklist: deposit, bond, lease signing, and keys.',
        'Upload payment proofs when requested; your agent confirms each step.',
        'Confirm your ingoing condition report section by section to finalise move-in.',
      ],
    },
    {
      id: 'repairs',
      title: '5. Repairs & maintenance',
      summary:
        'Report issues, track progress, message your agent or contractor, and approve completed work.',
      steps: [
        'Open Repair → Report a repair.',
        'Choose the issue type, describe the problem, and attach photos if helpful.',
        'Mark urgent only for eligible emergencies (e.g. flooding, lockout, no hot water, electrical fault).',
        'Track status under Active repairs; view completed jobs under History.',
        'When work is finished, approve completion from Home or the repair detail screen.',
      ],
      tips: [
        'For life-threatening emergencies (fire, gas leak, serious injury), call emergency services first.',
      ],
    },
    {
      id: 'inspections',
      title: '6. Inspections',
      summary:
        'Ingoing, outgoing, and routine inspections keep a record of your property condition.',
      steps: [
        'Open Inspection from Home or the Inspections list.',
        'Ingoing — confirm each section at move-in.',
        'Routine — complete self-inspection checklists when assigned, or be available for scheduled visits.',
        'Outgoing — confirm each section at move-out and upload supporting photos when asked.',
        'Flag maintenance issues during an inspection to create a repair request.',
      ],
    },
    {
      id: 'accounting',
      title: '7. Rent & accounting',
      summary:
        'Pay rent, view your current rate, and download receipts from the Accounting tab.',
      steps: [
        'Open Accounting → Overview to see your current rent and payment instructions.',
        'Upload payment proof when requested so your agent can reconcile your account.',
        'Open History for rent receipts and charges.',
        'When you receive a rent review notice, open Rent review to accept, decline, or counter offer.',
        'Use Lease renewal to confirm whether you intend to stay when your lease is ending.',
      ],
    },
    {
      id: 'messages',
      title: '8. Messages & notifications',
      summary:
        'Stay in touch with your property manager and get alerts when something needs your attention.',
      steps: [
        'Open Message from the bottom navigation.',
        'Start a new thread and choose a topic: leasing, maintenance, inspection, or accounting.',
        'Tap the bell icon for in-app notifications — approvals, inspections, maintenance updates, and more.',
        'Adjust notification preferences under Settings.',
      ],
    },
    {
      id: 'move-out',
      title: '9. Moving out',
      summary:
        'Give notice, complete outgoing inspection, and confirm bond settlement through the app.',
      steps: [
        'Use Lease renewal or End of lease to set a vacating date when your lease is ending.',
        'If you receive a termination notice, respond by the date shown and confirm your move-out plan.',
        'Complete the outgoing condition report and any make-good items.',
        'Confirm bond settlement when End of lease shows it is ready for your review.',
      ],
    },
    {
      id: 'help',
      title: '10. Help & support',
      summary:
        'Additional resources if you get stuck.',
      steps: [
        'FAQ — expandable answers in the menu under FAQ or Settings.',
        'App tutorial — short overview under App tutorial in the menu.',
        'Send a message to your property manager for anything not covered here.',
        'Profile — update emergency contact and view your application history.',
      ],
    },
  ] satisfies TenantAppGuideSection[],
  footer:
    '© CROSSUB — Your property partner. For account or access issues, contact your property manager or the agency that manages your lease.',
} as const;

export const TENANT_APP_GUIDE_PDF_FILENAME = 'CROSSUB-Tenant-App-Guide.pdf';

/** Served from /public after `pnpm generate:guide-pdf`; API route regenerates on demand. */
export const TENANT_APP_GUIDE_PDF_HREF = `/${TENANT_APP_GUIDE_PDF_FILENAME}`;
export const TENANT_APP_GUIDE_PDF_API = '/api/tenant-guide.pdf';
