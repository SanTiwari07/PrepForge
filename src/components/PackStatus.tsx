import type { ModuleId } from '@/content/schema';
import { retry, type LoadState } from '@/content/loader';
import { Callout } from './ui';

/** Shown while a module's content pack loads, or with a retry button if it failed. */
export function PackStatus({ state, modules }: { state: LoadState; modules: ModuleId[] }) {
  if (state === 'ready') return null;
  if (state === 'error') {
    return (
      <Callout tone="danger" title="This content could not be loaded">
        <p className="small" style={{ margin: '0 0 8px' }}>Check your connection and try again. Your progress is safe; it is stored in this browser.</p>
        <button className="btn btn--secondary btn--sm" onClick={() => retry(modules)}>Retry</button>
      </Callout>
    );
  }
  return <p className="muted small" role="status" aria-live="polite">Loading content…</p>;
}
