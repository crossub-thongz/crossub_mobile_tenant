import { LIST_MAX_PAGES, LIST_PAGE_SIZE } from '@/constants/paged-list';

/** One page of a `Paginated…` response, reduced to what the paging loop needs. */
export interface ListPage<T> {
  items: T[];
  hasMore: boolean;
}

/**
 * Read a paged tenant list to the end and return every row.
 *
 * Every list facade returns `{ items, total, page, pageSize, hasMore }` and defaults to 20
 * rows per page. Reading `data.items` from a single unparameterised call therefore truncates
 * the list at 20 while looking like a complete answer, because `total`/`hasMore` get dropped
 * on the floor — which is exactly how a tenant's repair list came to show yesterday's jobs
 * above today's, and how their rent ledger would have silently stopped at 20 payments.
 *
 * `loadPage` throws on a failed page, so a partial list can never be mistaken for the whole.
 */
export async function collectPages<T>(
  loadPage: (page: number, pageSize: number) => Promise<ListPage<T>>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 1; page <= LIST_MAX_PAGES; page += 1) {
    const { items, hasMore } = await loadPage(page, LIST_PAGE_SIZE);
    rows.push(...items);
    if (!hasMore || items.length === 0) break;
  }
  return rows;
}
