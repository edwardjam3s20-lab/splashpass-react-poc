// Structured content for the public /legal/:slug pages. Keeping this as
// plain data (rather than markdown + a parser/library) avoids pulling in
// a new dependency just to render three static pages.
//
// NOTE: several values below are [placeholders] — cancellation windows,
// fee amounts, refund processing times, and contact details — that need
// to be confirmed and filled in before these are treated as final/live
// for Paystack verification or public use.

export interface LegalSection {
  heading: string
  paragraphs: string[]
}

export interface LegalPage {
  title: string
  updated: string
  intro: string
  sections: LegalSection[]
}

export const LEGAL_PAGES: Record<string, LegalPage> = {
  'acceptable-use': {
    title: 'Acceptable Use Policy',
    updated: '[date]',
    intro:
      'This Acceptable Use Policy ("Policy") governs your use of SplashPass, a car wash booking and operator management platform operated by KINGJAMES TECHNOLOGIES ("SplashPass," "we," "us," or "our"), including our website, mobile applications, and any related services (collectively, the "Platform"). By creating an account or using the Platform, you agree to this Policy. If you do not agree, do not use the Platform. This Policy applies to all users of the Platform, including motorists booking car wash services ("Customers") and car wash businesses offering services through the Platform ("Operators").',
    sections: [
      {
        heading: '1. Eligibility and Account Responsibility',
        paragraphs: [
          '1.1. You must provide accurate, current, and complete information when creating an account, including a valid phone number and email address.',
          '1.2. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately at [support email] if you suspect unauthorized access.',
          '1.3. You must be at least 18 years old, or the age of legal majority in your jurisdiction, to create an account and enter into transactions on the Platform.',
          '1.4. One account per individual or business. Creating multiple accounts to circumvent restrictions, promotions, loyalty program limits, or suspensions is prohibited.',
        ],
      },
      {
        heading: '2. Prohibited Conduct',
        paragraphs: [
          'You agree not to, and not to assist others to:',
          '2.1. Provide false information, including fake names, phone numbers, vehicle details, or payment information.',
          '2.2. Abuse the wallet, loyalty points, referral, or promotional systems, including but not limited to: creating fraudulent bookings to earn points, exploiting referral bonuses through self-referral or fake accounts, or manipulating points-to-cash conversions through non-genuine transactions.',
          '2.3. Interfere with bookings, including repeatedly booking and cancelling services to inconvenience Operators, making bookings with no intention of honoring them, or manipulating the booking queue.',
          '2.4. Engage in fraudulent payment activity, including using stolen payment cards or M-Pesa accounts, initiating chargebacks or reversals for services genuinely received, or attempting to pay through unauthorized or unverified channels.',
          '2.5. Harass, threaten, or discriminate against other users, Operators, or SplashPass staff, whether in person at a wash point, through in-platform messaging, or through reviews and ratings.',
          "2.6. Submit false or manipulated reviews and ratings, including posting reviews for services not received, offering or accepting incentives in exchange for positive reviews, or attempting to manipulate an Operator's SplashScore.",
          '2.7. Interfere with the Platform\u2019s operation, including probing, scanning, or testing the vulnerability of the Platform without authorization; attempting to bypass rate limits, authentication, or CORS protections; scraping data at scale; or introducing malware, bots, or automated scripts not expressly permitted by us.',
          '2.8. Reverse engineer, decompile, or attempt to extract source code from the Platform, except where such restriction is prohibited by applicable law.',
          '2.9. Use the Platform for any unlawful purpose, or in violation of any applicable local, national, or international law or regulation.',
          '2.10. Impersonate any person or entity, or misrepresent your affiliation with any person or entity, including posing as a SplashPass Operator without an approved Operator account.',
        ],
      },
      {
        heading: '3. Operator-Specific Obligations',
        paragraphs: [
          '3.1. Operators must provide accurate service listings, pricing, and operating hours, and must honor confirmed bookings made through the Platform.',
          '3.2. Operators must not solicit Customers to transact outside the Platform in order to avoid applicable commissions or fees.',
          '3.3. Operators must maintain a safe, professional standard of service consistent with the description of services listed on the Platform.',
          '3.4. Operators found to be engaging in fraudulent booking confirmations, fake completions, or manipulation of payouts will be subject to suspension and forfeiture of pending payouts pending investigation.',
        ],
      },
      {
        heading: '4. Enforcement',
        paragraphs: [
          '4.1. We reserve the right, at our sole discretion, to investigate suspected violations of this Policy, and to suspend or terminate accounts, cancel bookings, withhold or reverse wallet balances obtained through fraudulent activity, and/or report unlawful conduct to relevant authorities.',
          '4.2. Violations may result in temporary suspension, permanent termination, forfeiture of loyalty points or promotional credit obtained in violation of this Policy, and, where applicable, legal action.',
          '4.3. We may, but are not obligated to, provide notice before taking enforcement action, particularly in cases of suspected fraud or risk to other users.',
        ],
      },
      {
        heading: '5. Reporting Violations',
        paragraphs: [
          'If you become aware of a violation of this Policy, please report it to [support email] or through the in-app support channel. Include as much detail as possible, including account identifiers, dates, and a description of the conduct.',
        ],
      },
      {
        heading: '6. Changes to This Policy',
        paragraphs: [
          'We may update this Policy from time to time. Material changes will be communicated via the Platform or by email. Continued use of the Platform after changes take effect constitutes acceptance of the revised Policy.',
        ],
      },
      {
        heading: '7. Contact',
        paragraphs: [
          'Questions about this Policy can be directed to:',
          'KINGJAMES TECHNOLOGIES\n[registered business address]\n[support email]\n[support phone number]',
        ],
      },
    ],
  },

  'service-policy': {
    title: 'Service Delivery Policy',
    updated: '[date]',
    intro:
      'SplashPass is a service marketplace platform, not a retailer of physical goods \u2014 there is no shipping involved. This Service Delivery Policy explains how car wash services booked through SplashPass are delivered, so both Customers and Operators know what to expect.',
    sections: [
      {
        heading: '1. What SplashPass Provides',
        paragraphs: [
          'SplashPass, operated by KINGJAMES TECHNOLOGIES, is a booking and operator management platform that connects motorists ("Customers") with independent car wash businesses ("Operators") in Mombasa, Kenya. SplashPass does not itself wash vehicles. Services are performed by independent Operators at their own wash points, in accordance with the service listing, pricing, and operating hours each Operator sets on the Platform.',
        ],
      },
      {
        heading: '2. Booking and Confirmation',
        paragraphs: [
          "2.1. When a Customer submits a booking, it is sent to the selected Operator (or wash point) for confirmation, subject to that Operator's real-time availability and operating hours.",
          '2.2. Booking status is reflected in the app in real time. A booking is not guaranteed until it shows as confirmed.',
          "2.3. Estimated service windows are provided at the time of booking based on the Operator's stated availability. These are estimates, not guaranteed arrival or completion times, as service duration can be affected by vehicle volume, weather, and vehicle condition.",
        ],
      },
      {
        heading: '3. Service Delivery',
        paragraphs: [
          "3.1. Services are delivered in person at the Operator's physical wash point location, or at a location specified by the Operator (e.g., mobile wash services, where offered), as shown in the Operator's listing.",
          '3.2. Customers are expected to arrive within [30 minutes] of their booked time slot. Operators may release the slot to other customers if the Customer does not arrive within this window, without it being treated as a service failure by the Operator (see Section 4 for cancellation terms).',
          '3.3. Operators are expected to honor confirmed bookings and deliver the service described in their listing (e.g., exterior wash, interior vacuum, full detail) within the operating hours shown on the Platform.',
          "3.4. If an Operator is unable to fulfil a confirmed booking (e.g., equipment failure, unexpected closure), the Customer will be notified through the Platform as soon as possible and offered a full refund to their original payment method or SplashPass wallet, at the Customer's choice, or the option to rebook with another available Operator.",
        ],
      },
      {
        heading: '4. Cancellations and No-Shows',
        paragraphs: [
          "4.1. Customer cancellations: Bookings may be cancelled free of charge up to [1 hour] before the scheduled time. Cancellations made after this window, or no-shows, may be subject to a cancellation fee of [amount/percentage], charged to the Customer's wallet or original payment method, to compensate the Operator for the reserved slot.",
          '4.2. Operator cancellations: If an Operator cancels a confirmed booking, the Customer is entitled to a full refund with no cancellation fee, per Section 3.4.',
          '4.3. Repeated cancellations or no-shows by a Customer may result in restrictions on future bookings, in accordance with our Acceptable Use Policy.',
        ],
      },
      {
        heading: '5. Service Area',
        paragraphs: [
          "SplashPass currently operates in Mombasa, Kenya. Available Operators and wash points are shown based on the Customer's location within the app. We may expand to additional areas over time; availability is not guaranteed outside currently listed wash points.",
        ],
      },
      {
        heading: '6. Service Quality and Disputes',
        paragraphs: [
          '6.1. If a Customer is dissatisfied with a completed service, they should report the issue through the Platform within [24 hours] of service completion, describing the issue and, where possible, providing photos.',
          "6.2. SplashPass will review disputes between Customers and Operators in good faith and may, at its discretion, issue a partial or full refund, credit the Customer's wallet, or facilitate a resolution directly between the parties.",
          "6.3. Persistent service quality issues from a given Operator may result in that Operator's suspension from the Platform.",
        ],
      },
      {
        heading: '7. Contact',
        paragraphs: [
          'Questions about a specific booking or this Policy can be directed to:',
          'KINGJAMES TECHNOLOGIES\n[registered business address]\n[support email]\n[support phone number]',
        ],
      },
    ],
  },

  refunds: {
    title: 'Returns & Refund Policy',
    updated: '[date]',
    intro:
      'SplashPass provides car wash booking services, not physical goods, so this Policy covers refunds for bookings, subscription plans, and wallet transactions rather than product returns. It should be read alongside our Service Delivery Policy, which explains cancellation windows in more detail.',
    sections: [
      {
        heading: '1. Booking Refunds',
        paragraphs: [
          '1.1. Operator-caused cancellation or service failure: If SplashPass or the Operator cancels a confirmed booking, or the service is not delivered as described, the Customer is entitled to a full refund.',
          '1.2. Customer cancellation within the free window: Cancellations made [1 hour] or more before the scheduled time are refunded in full, with no deduction.',
          '1.3. Customer cancellation or no-show outside the free window: A cancellation fee of [amount/percentage] may apply, as described in our Service Delivery Policy. The remaining balance, if any, is refunded.',
          '1.4. Duplicate or failed payments: If a payment is deducted more than once for the same booking, or a payment fails to reflect but funds are deducted, report this immediately through the app or to [support email] with your M-Pesa/transaction reference or card payment reference. Verified duplicate or failed transactions are refunded in full.',
        ],
      },
      {
        heading: '2. Wallet Refunds',
        paragraphs: [
          "2.1. Funds added to a Customer's SplashPass wallet via M-Pesa or card are intended for use on the Platform (bookings, subscriptions, and related services).",
          '2.2. Wallet balances are non-withdrawable to a bank account or M-Pesa in the ordinary course, except where required by law or at SplashPass\u2019s discretion (for example, account closure with a remaining balance \u2014 see Section 5).',
          '2.3. Loyalty points converted to wallet cash, once converted, follow the same wallet rules above and are not separately refundable or reversible.',
          '2.4. If a wallet top-up was made in error or due to a technical fault (e.g., a failed M-Pesa STK push that still deducted funds, or a duplicate card charge), report it to [support email] with your transaction reference for investigation and reversal.',
        ],
      },
      {
        heading: '3. Subscription Plan Refunds',
        paragraphs: [
          '3.1. Subscription plans (e.g., trial, Individual, Family/Duo, or other tiers) are billed [monthly] in advance.',
          '3.2. If you cancel a paid subscription, you retain access to your current plan\u2019s benefits until the end of the billing period already paid for. We do not provide prorated refunds for the unused portion of a billing period, except where the cancellation is due to a service failure on our part.',
          '3.3. If a subscription payment is charged in error (e.g., duplicate charge, charge after cancellation was already processed), report it to [support email] for a full refund of the erroneous charge.',
          '3.4. The 30-day free trial referenced during onboarding is not a paid period and is not subject to this Section; no charge occurs unless and until you actively subscribe to a paid plan.',
        ],
      },
      {
        heading: '4. How Refunds Are Processed',
        paragraphs: [
          "4.1. Refunds are issued to the original payment method used (M-Pesa, or card via Paystack), or credited to the Customer's SplashPass wallet, at the Customer's request where applicable.",
          "4.2. M-Pesa refunds are typically processed within [X business days] of approval. Card refunds via Paystack are typically processed within [5\u201310 business days], depending on the card issuer's own processing times, which are outside our control.",
          '4.3. Refunds are issued in Kenyan Shillings (KES).',
        ],
      },
      {
        heading: '5. Account Closure',
        paragraphs: [
          'If you close your SplashPass account with a remaining wallet balance, contact [support email] to request settlement of the balance. We may require identity verification before releasing funds, to prevent fraud.',
        ],
      },
      {
        heading: '6. Chargebacks and Payment Disputes',
        paragraphs: [
          '6.1. If you believe a charge was made in error or without authorization, we ask that you contact us at [support email] first so we can investigate and resolve the issue directly \u2014 this is typically faster than a bank or card issuer dispute process.',
          '6.2. Initiating a chargeback for a service that was genuinely booked and delivered, without first attempting to resolve the issue with us, may result in account suspension pending investigation, consistent with our Acceptable Use Policy.',
        ],
      },
      {
        heading: '7. Contact',
        paragraphs: [
          'To request a refund or report a payment issue, contact:',
          'KINGJAMES TECHNOLOGIES\n[registered business address]\n[support email]\n[support phone number]',
          'Please include your registered phone number/email, the transaction date, and the M-Pesa or card transaction reference where available, to help us resolve your request quickly.',
        ],
      },
    ],
  },
}
