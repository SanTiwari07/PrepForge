import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="stack-lg">
      <EmptyState
        title="This page does not exist"
        action={<div className="row"><Link to="/" className="btn btn--primary">Go to dashboard</Link><Link to="/learn" className="btn btn--secondary">Browse subjects</Link></div>}
      >
        The link may be outdated. Use search (Ctrl K) to find a topic, problem or question.
      </EmptyState>
    </div>
  );
}
