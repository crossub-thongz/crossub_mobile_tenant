/**
 * Prefix of a repair id minted in the browser before the API confirmed the job. The live
 * form always submits first and passes the server id, so this only covers the offline
 * fallback in `addRepair` — but the distinction matters: a row with a server id that is
 * missing from a complete API list has been deleted, while a row with this prefix simply
 * has not been confirmed yet.
 */
export const LOCAL_MAINTENANCE_REQUEST_ID_PREFIX = 'repair-';
