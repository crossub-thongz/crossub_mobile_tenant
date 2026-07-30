/**
 * Paging applied to every `Paginated…` tenant list facade. The app renders these lists whole
 * — there is no "load more" anywhere — so each fetch reads to the end rather than settling
 * for the API's default first 20.
 */

/** Items per page to request. The API's `PaginationQueryDto` rejects anything above 100. */
export const LIST_PAGE_SIZE = 100;

/**
 * Safety stop for the paging loops (100 × 20 = 2000 rows, well past any real tenancy) so a
 * wrong `hasMore` from the API can never spin the app forever.
 */
export const LIST_MAX_PAGES = 20;
