/** Copy aligned with tenant requirements doc §5.2 — confirm amounts/wording with Leasing/Fay. */

export const PAYMENT_STEP_COPY = {
  deposit: {
    summary:
      'The deposit (typically 2 weeks rent) secures your application before move-in. It is separate from your bond.',
    instructions: [
      'Pay the deposit amount shown below to the account details provided by CROSSUB/Leasing.',
      'Upload a clear screenshot or PDF of your bank transfer or receipt.',
      'Approval is recorded in this app — you will be notified when accepted.',
    ],
    faq: null,
  },
  bond: {
    summary:
      'Yes — bond proof is still required even after you upload deposit proof. They are two different payments.',
    instructions: [
      'Deposit = holding/first-payment step (e.g. 2 weeks rent).',
      'Bond = security deposit (e.g. 4 weeks rent), usually lodged with the rental bond authority (RBO in Australia) or a designated account per your state/country.',
      'Upload proof that the full bond amount has been paid or lodged as instructed by your agent.',
    ],
    faq: {
      question: 'I already paid the deposit — do I still need bond proof?',
      answer:
        'Yes. The onboarding checklist requires both uploads when your lease requires both. Paying the deposit does not replace the bond. If your situation is different (e.g. bond-free arrangement), contact CROSSUB before skipping this step.',
    },
  },
} as const;
