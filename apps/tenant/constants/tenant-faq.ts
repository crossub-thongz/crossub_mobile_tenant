export type TenantFaqItem = {
  question: string;
  answer: string;
};

export type TenantFaqSection = {
  id: string;
  title: string;
  items: TenantFaqItem[];
};

export const TENANT_FAQ_SECTIONS: TenantFaqSection[] = [
  {
    id: 'account',
    title: 'Account & sign in',
    items: [
      {
        question: 'How do I sign in for the first time?',
        answer:
          'After your lease is set up, your property manager sends tenant login credentials to your email. Open the CROSSUB Tenant app, enter that email and password on the sign-in screen, and follow any prompts to complete your profile. If you were just approved but cannot see your property yet, your agent may still need to link your account — check Messages or contact your property manager.',
      },
      {
        question: 'What should I do if I forget my password?',
        answer:
          'Tap Forgot password? on the sign-in screen. If password reset is enabled for your agency, you will receive an email link to choose a new password. If reset is not available in your environment, contact your property manager — they can reissue tenant login credentials from your approved application.',
      },
      {
        question: 'Why does it say this portal is for tenants only?',
        answer:
          'The CROSSUB Tenant app accepts TENANT accounts only. Staff and agent logins use the CROSSUB admin portal instead. If you signed in with the wrong account type, sign out and use the tenant credentials sent to you after lease setup.',
      },
      {
        question: 'Do I need an account to browse rentals?',
        answer:
          'No. You can browse available properties and start an application without signing in. Sign in once you have tenant credentials or when you want to manage an active tenancy.',
      },
    ],
  },
  {
    id: 'leasing',
    title: 'Applying & move-in',
    items: [
      {
        question: 'How do I apply for a property?',
        answer:
          'From Browse listings, open a property and follow the application steps. When enabled, you will complete the NSW tenancy application form and upload supporting documents. Submitted applications appear under Applications in the menu.',
      },
      {
        question: 'What happens after my application is approved?',
        answer:
          'Your agent opens a new-leasing case and sends tenant login credentials. The Home screen and Property tab show your address once the lease is linked. Complete the onboarding checklist — deposit, bond, lease signing, key collection, and payment proofs — coordinated with your agent.',
      },
      {
        question: 'What is the onboarding checklist?',
        answer:
          'Onboarding walks you through move-in steps in order: payments, document signing, key handover, and any proofs your agent requests. Each step shows instructions in the app. Your agent confirms uploaded proofs before you can continue.',
      },
      {
        question: 'When is my move-in official?',
        answer:
          'Move-in is official once onboarding is complete and you have confirmed your ingoing condition report section by section. Until then, day-to-day Repairs and Accounting features may be limited.',
      },
    ],
  },
  {
    id: 'lease',
    title: 'Lease, rent & accounting',
    items: [
      {
        question: 'Where can I view my lease details?',
        answer:
          'Open Property for your address, rent, and key dates, or My lease for start and end dates, weekly rent, status, and tenancy agreement documents. Lease PDFs also appear under Documents.',
      },
      {
        question: 'How do I pay rent?',
        answer:
          'Go to Accounting → Overview. Pay rent shows your current amount and payment instructions for your tenancy. Upload payment proof when requested so your agent can reconcile your account.',
      },
      {
        question: 'Where are my rent receipts and statements?',
        answer:
          'Accounting → History lists rent receipts and charges. At end of lease, your final statement appears there and under Documents when it is ready.',
      },
      {
        question: 'What is a rent review notice?',
        answer:
          'When your rent is reviewed, you receive a notification with the proposed weekly amount. Open Rent review to accept, decline, or — if negotiable — submit a counter offer. You may also indicate a move-out date instead of renewing.',
      },
      {
        question: 'How do I respond to a lease renewal reminder?',
        answer:
          'If your lease is ending within 90 days, open Lease renewal from the menu or Property tab. Confirm whether you intend to renew, or enter a vacating date to start the end-of-lease workflow.',
      },
    ],
  },
  {
    id: 'repairs',
    title: 'Repairs & maintenance',
    items: [
      {
        question: 'How do I report a repair?',
        answer:
          'Open Repair → Report a repair. Choose the issue type, describe the problem, attach photos or video if helpful, and submit. Your request receives a tracking number and appears under Active repairs.',
      },
      {
        question: 'How do I track repair progress?',
        answer:
          'Active repairs show the current status on the Repair screen and on Home. Open a request for full detail — assignment, scheduling, and contractor updates. You will also receive in-app notifications when the status changes.',
      },
      {
        question: 'What should I do for an urgent issue?',
        answer:
          'For flooding, loss of hot water, electrical faults, or lockouts, mark the request as urgent when the issue type allows it. For life-threatening emergencies (fire, gas leak, serious injury), call emergency services first — do not rely on the app alone.',
      },
      {
        question: 'How do I approve completed repair work?',
        answer:
          'When a contractor marks work complete, Home shows Completion approval needed. Open the repair and confirm the work is finished to your satisfaction. You can message your agent or the contractor from the repair detail screen if something is unresolved.',
      },
    ],
  },
  {
    id: 'inspections',
    title: 'Inspections',
    items: [
      {
        question: 'What types of inspections appear in the app?',
        answer:
          'Ingoing — condition report at move-in. Routine — periodic inspections during your tenancy. Outgoing — condition report at move-out. All appear under Inspection on Home or the Inspections list, filterable by type.',
      },
      {
        question: 'How do I complete an ingoing or outgoing report?',
        answer:
          'Open the inspection from Home or Inspections. Review each section, confirm the condition notes, and upload supporting photos when asked — for example re-clean, repair, or damage items on an outgoing report.',
      },
      {
        question: 'What is a routine self-inspection?',
        answer:
          'Some routine inspections are assigned as self-inspections. The app guides you room by room to upload photos and brief notes on your schedule. You can save progress and return later until you submit.',
      },
      {
        question: 'What if I find a problem during an inspection?',
        answer:
          'Flag maintenance items during the inspection flow where prompted, or open Repair → Report a repair separately. Flagged items become maintenance requests your property manager can action.',
      },
    ],
  },
  {
    id: 'move-out',
    title: 'Moving out & end of lease',
    items: [
      {
        question: 'How do I give notice to vacate?',
        answer:
          'Use Lease renewal if your fixed term is ending, or End of lease to set a vacating date when your agent opens a case. If you receive a termination notice from CROSSUB, respond by the date shown and confirm your move-out plan.',
      },
      {
        question: 'What happens during end of lease?',
        answer:
          'The End of lease workflow covers key return, outgoing inspection, make-good items, and bond settlement. Follow each stage in the app and respond when bond settlement is ready for your confirmation.',
      },
      {
        question: 'Can I arrange move-out services through the app?',
        answer:
          'When vacating, End of lease may link to moving and cleaning services your agency offers. Your property manager can advise what is available for your property.',
      },
    ],
  },
  {
    id: 'messages',
    title: 'Messages & notifications',
    items: [
      {
        question: 'How do I contact CROSSUB or my property manager?',
        answer:
          'Open Message from the bottom navigation. Start a new thread and choose a topic — leasing, maintenance, inspection, or accounting — so your message reaches the right team. You can also reply from repair or rent-review screens.',
      },
      {
        question: 'How do notifications work?',
        answer:
          'The bell icon shows in-app alerts for approvals, inspections, maintenance updates, rent reviews, and other tenancy events. Tap a notification to open the relevant screen. Adjust which triggers you care about under Settings → Notification preferences.',
      },
    ],
  },
  {
    id: 'support',
    title: 'Documents, privacy & support',
    items: [
      {
        question: 'Where are my documents stored?',
        answer:
          'Documents holds your lease, receipts, deposit and bond proofs, inspection reports, and statements. Profile also links to your document library and rental application history.',
      },
      {
        question: 'Is my personal information secure?',
        answer:
          'CROSSUB uses encrypted connections and secure sign-in for your tenancy data, documents, and messages. Only authorised agency staff and assigned contractors see information relevant to your property.',
      },
      {
        question: 'The app shows no property linked — what should I do?',
        answer:
          'This usually means your login is active but not yet linked to a tenancy. Ask your agent to resend tenant credentials from your approved application, or message them through the app once messaging is available.',
      },
      {
        question: 'Where can I learn how to use the app?',
        answer:
          'Open App tutorial from the menu for a quick tour of Home, Property, Repair, rent review, and the new-tenant journey. The welcome guide also appears after your first sign-in when onboarding applies.',
      },
    ],
  },
];
