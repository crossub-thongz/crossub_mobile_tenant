/** Copy aligned with tenant requirements doc §5.2 — confirm amounts/wording with Leasing/Fay. */

export const PAYMENT_STEP_COPY = {
  deposit: {
    instructions: [
      'Pay the deposit amount shown below to the account details provided by CROSSUB/Leasing.',
      'Upload a clear screenshot or PDF of your bank transfer or receipt.',
      'Approval is recorded in this app — you will be notified when accepted.',
    ],
    faq: null,
  },
  bond: {
    instructions: [
      'Deposit = holding/first-payment step (e.g. 2 weeks rent).',
      'Bond = security deposit (e.g. 4 weeks rent), usually lodged with the rental bond authority (RBO in Australia) or a designated account per your state/country.',
      'Upload proof that the full bond amount has been paid or lodged as instructed by your agent.',
    ],
  },
} as const;
