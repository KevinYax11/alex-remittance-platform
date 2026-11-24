interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

function getVisiblePages(current: number, last: number) {
  if (last <= 5) return Array.from({ length: last }, (_, index) => index + 1);
  const middle = Math.min(Math.max(current, 3), last - 2);
  const pages = [1, middle - 1, middle, middle + 1, last];
  return pages.flatMap((page, index) => index > 0 && page - pages[index - 1] > 1
    ? [`gap-${page}`, page]
    : [page]);
}

export default function DashboardPagination({ page, pageSize, total, onPageChange }: Props) {
  if (!total) return null;

  const last = Math.ceil(total / pageSize);
  const firstResult = Math.min((page - 1) * pageSize + 1, total);
  const lastResult = Math.min(page * pageSize, total);

  return (
    <nav className="payments-pagination" aria-label="Paginación de transacciones">
      <p className="payments-page-range" aria-live="polite">
        <strong>{firstResult}–{lastResult}</strong> de <strong>{total}</strong> {total === 1 ? "transacción" : "transacciones"}
      </p>
      <div className="payments-page-controls">
        <button type="button" className="payments-page-direction" aria-label="Página anterior"
          disabled={page === 1} onClick={() => onPageChange(page - 1)}>
          <span aria-hidden="true">←</span> <span className="payments-page-direction-label">Anterior</span>
        </button>
        <div className="payments-page-numbers">
          {getVisiblePages(page, last).map(item => typeof item === "number" ? (
            <button key={item} type="button" aria-label={`Página ${item}`}
              aria-current={item === page ? "page" : undefined}
              onClick={() => onPageChange(item)}>{item}</button>
          ) : <span className="payments-page-gap" key={item} aria-hidden="true">…</span>)}
        </div>
        <span className="payments-page-mobile" aria-current="page">Página {page} de {last}</span>
        <button type="button" className="payments-page-direction" aria-label="Página siguiente"
          disabled={page >= last} onClick={() => onPageChange(page + 1)}>
          <span className="payments-page-direction-label">Siguiente</span> <span aria-hidden="true">→</span>
        </button>
      </div>
    </nav>
  );
}
