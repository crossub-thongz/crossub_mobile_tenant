/** Copy aligned with tenant requirements doc §5.2 — confirm amounts/wording with Leasing/Fay. */

export const PAYMENT_STEP_COPY = {
  deposit: {
    summary:
      'Pay your holding deposit and upload proof so Leasing can confirm the payment.',
    instructions: [
      'Pay the deposit amount shown below to the account details provided by CROSSUB/Leasing.',
      'Upload a clear screenshot or PDF of your bank transfer or receipt.',
      'Approval is recorded in this app — you will be notified when accepted.',
    ],
    faq: null,
  },
  bond: {
    summary:
      'Pay or lodge your rental bond as instructed by your agent, then upload proof.',
    instructions: [
      'Upload proof that the full bond amount has been paid or lodged as instructed by your agent.',
    ],
    faq: {
      question: 'What is the difference between the deposit and the bond?',
      answer:
        'Deposit = holding/first-payment step (e.g. 2 weeks rent). Bond = security deposit (e.g. 4 weeks rent), usually lodged with the rental bond authority (RBO in Australia) or a designated account per your state/country.',
    },
  },
} as const;
