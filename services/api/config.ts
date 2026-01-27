const TRANSFER_REQUESTS = {
  ALL: '/api/transfers',
  BY_ID: (id: string) => `/api/transfers/${id}`,
  CREATE: '/api/transfers/request',
  APPROVE: (id: string) => `/api/transfers/${id}/approve`,
  REJECT: (id: string) => `/api/transfers/${id}/reject`,
  SEND: (id: string) => `/api/transfers/${id}/send`,
  CONFIRM_RECEIPT: (id: string) => `/api/transfers/${id}/receive`,
  CANCEL: (id: string) => `/api/transfers/${id}/cancel`,
  HISTORY: '/api/transfers/history',
  // SUMMARY: '/api/transfer-requests/summary',  // removed as backend doesn't have this endpoint
  COMPLETE: (id: string) => `/api/transfers/${id}/complete`
};