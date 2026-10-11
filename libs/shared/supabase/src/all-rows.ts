// The API returns at most max_rows rows per request, as set in
// supabase/config.toml and the project's API settings.
export const pageSize = 1000;

export interface RowsResult<Row> {
  readonly data: Row[] | null;
  readonly error: unknown;
}

// Reads every page of a query. The query must have a stable order, so no row
// moves between pages.
export async function allRows<Row>(
  page: (from: number, to: number) => PromiseLike<RowsResult<Row>>,
): Promise<RowsResult<Row>> {
  const rows: Row[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1);
    if (error) {
      return { data: null, error };
    }
    rows.push(...(data ?? []));
    if ((data ?? []).length < pageSize) {
      return { data: rows, error: null };
    }
  }
}
