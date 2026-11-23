export const REVIEW_CHECKLIST = [
  {
    key: "parties",
    label: "Parties",
    fallbackTerms: ["party", "parties", "nimbus", "orchid", "address"],
    searchQuery:
      "Names, legal identities, roles and addresses of all parties entering this agreement, including company, employee, client or contractor.",
  },
  {
    key: "start_date_term",
    label: "Start date and term",
    fallbackTerms: ["effective date", "commencement", "start date", "initial term", "12 months", "31 december"],
    searchQuery:
      "Effective date, commencement date, start date, agreement duration, contract term, expiry date and end date.",
  },
  {
    key: "payment_terms",
    label: "Payment terms",
    fallbackTerms: ["payment", "invoice", "fee", "inr", "interest", "30 days"],
    searchQuery:
      "Payment amount, fees, salary, compensation, payment schedule, due dates, invoicing and payment conditions.",
  },
  {
    key: "termination",
    label: "Termination",
    fallbackTerms: ["terminate", "termination", "notice", "breach", "convenience"],
    searchQuery:
      "Termination, cancellation, ending the agreement, notice period, termination for cause, termination rights and consequences.",
  },
  {
    key: "limitation_of_liability",
    label: "Limitation of liability",
    fallbackTerms: ["liability", "aggregate", "indirect", "consequential", "loss", "damages"],
    searchQuery:
      "Limitation of liability, liability cap, maximum liability, exclusion of damages, indirect damages and financial responsibility.",
  },
  {
    key: "confidentiality",
    label: "Confidentiality",
    fallbackTerms: ["confidential", "confidentiality", "disclose", "third party", "information"],
    searchQuery:
      "Confidential information, non-disclosure, confidentiality obligations, permitted disclosure and protection of information.",
  },
  {
    key: "governing_law",
    label: "Governing law",
    fallbackTerms: ["governing law", "applicable law", "governed by", "jurisdiction", "courts", "exclusive jurisdiction"],
    searchQuery:
      "Governing law, applicable law, jurisdiction, courts and laws that govern this agreement.",
  },
  {
    key: "auto_renewal",
    label: "Auto-renewal",
    fallbackTerms: ["renew", "renewal", "successive", "non-renewal", "60 days"],
    searchQuery:
      "Automatic renewal, auto-renewal, automatic extension, renewal period, successive terms and notice to prevent renewal.",
  },
];