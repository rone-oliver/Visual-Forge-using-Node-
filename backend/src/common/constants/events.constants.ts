export enum EventTypes {
  // Bid events
  BID_CREATED = 'bid.created',
  BID_UPDATED = 'bid.updated',
  BID_ACCEPTED = 'bid.accepted',
  BID_REJECTED = 'bid.rejected',
  BID_DELETED = 'bid.deleted',

  // Quotation events
  QUOTATION_CREATED = 'quotation.created',
  QUOTATION_UPDATED = 'quotation.updated',
  QUOTATION_PUBLISHED = 'quotation.published',
  QUOTATION_COMPLETED = 'quotation.completed',
  QUOTATION_CANCELLED = 'quotation.cancelled',

  // User events
  USER_REGISTERED = 'user.registered',
  USER_UPDATED = 'user.updated',

  // Editor events
  EDITOR_REGISTERED = 'editor.registered',
  EDITOR_UPDATED = 'editor.updated',

  // Payment events
  PAYMENT_CREATED = 'payment.created',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',

  // Overdue Quotations events
  PAYMENT_REFUNDED = 'payment.refunded',
  EDITOR_SUSPENDED = 'editor.suspended',
  EDITOR_WARNING = 'editor.warning',
}
