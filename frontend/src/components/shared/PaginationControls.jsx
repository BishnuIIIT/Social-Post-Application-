import React from "react";
import Button from "./Button.jsx";
import styles from "./shared.module.css";

/**
 * Reusable PaginationControls component.
 * Displays "Load More" button, progress bar, and metrics label.
 *
 * @param {object}   props
 * @param {number}   props.loadedCount
 * @param {number}   props.totalCount
 * @param {boolean}  props.hasMore
 * @param {boolean}  props.loadingMore
 * @param {Function} props.onLoadMore
 * @param {boolean}  [props.showProgress=true]
 * @param {string}   [props.className=""]
 */
export default function PaginationControls({
  loadedCount,
  totalCount,
  hasMore,
  loadingMore,
  onLoadMore,
  showProgress = true,
  className = "",
}) {
  if (totalCount === 0) return null;

  const progressPct = Math.min(Math.round((loadedCount / totalCount) * 100), 100);

  return (
    <div className={`${styles.paginationWrapper} ${className}`}>
      {/* Load More Button */}
      {hasMore && (
        <Button
          variant="outline"
          size="md"
          loading={loadingMore}
          onClick={onLoadMore}
          aria-label={loadingMore ? "Loading more posts…" : "Load more posts"}
        >
          {loadingMore ? "Loading more moments…" : "Load more posts"}
        </Button>
      )}

      {/* Progress Bar */}
      {showProgress && totalCount > 0 && (
        <>
          <div
            className={styles.paginationProgress}
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            title={`${progressPct}% loaded`}
          >
            <div
              className={styles.paginationProgressBar}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className={styles.paginationMetric}>
            <span>
              Showing <strong>1–{loadedCount}</strong> of{" "}
              <strong>{totalCount}</strong> post{totalCount === 1 ? "" : "s"}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
