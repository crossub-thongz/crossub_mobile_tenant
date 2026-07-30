/**
 * Shape of the tenant repair list: how it is paged out of the API and how a row minted
 * in the browser is told apart from one the API returned.
 */

/**
 * Prefix of a repair id minted in the browser before the API confirmed the job. The live
 * form always submits first and passes the server id, so this only covers the offline
 * fallback in `addRepair` — but the distinction matters: a row with a server id that is
 * missing from a complete API list has been deleted, while a row with this prefix simply
 * has not been confirmed yet.
 */
export const LOCAL_MAINTENANCE_REQUEST_ID_PREFIX = 'repair-';

/** Page size for the maintenance list. The API rejects anything above 100. */
export const MAINTENANCE_REQUEST_PAGE_SIZE = 100;

/**
 * Safety stop for the paging loop (100 × 20 = 2000 repairs, far beyond any real tenancy)
 * so a wrong `hasMore` from the API can never spin the app forever.
 */
export const MAINTENANCE_REQUEST_MAX_PAGES = 20;
