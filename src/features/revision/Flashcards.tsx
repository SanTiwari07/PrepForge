import { useState } from 'react';
import { Plus, RotateCw } from 'lucide-react';
import type { Flashcard } from '@/content/schema';
import { Markdown } from '@/components/Markdown';
import { useStore } from '@/store/store';

export function Flashcards({ topicId, cards }: { topicId: string; cards: Flashcard[] }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const addCard = useStore((s) => s.addCard);
  const reviewCards = useStore((s) => s.reviewCards);
  const allAdded = cards.every((c) => reviewCards[`flashcard:${topicId}:${c.id}`]);
  const card = cards[i];

  return (
    <section className="card stack">
      <div className="row-between">
        <h2 className="card__title">Flashcards</h2>
        <button className="btn btn--secondary btn--sm" disabled={allAdded} onClick={() => cards.forEach((c) => addCard('flashcard', `${topicId}:${c.id}`, topicId))}>
          <Plus /> {allAdded ? 'All in revision queue' : 'Add all to spaced revision'}
        </button>
      </div>
      <button type="button" className={`flashcard${flipped ? ' is-flipped' : ''}`} onClick={() => setFlipped((f) => !f)} aria-label={flipped ? 'Show question' : 'Show answer'}>
        <span className="eyebrow">{flipped ? 'Answer' : 'Question'} · {i + 1}/{cards.length}</span>
        {flipped ? <Markdown md={card.backMd} /> : <span className="flashcard__front"><Markdown md={card.front} inline className="" /></span>}
        <span className="xsmall muted row" style={{ gap: 4 }}><RotateCw size={12} aria-hidden /> Click or press Space to flip</span>
      </button>
      <div className="row-between">
        <button className="btn btn--secondary btn--sm" onClick={() => { setI((i - 1 + cards.length) % cards.length); setFlipped(false); }}>Previous</button>
        <button className="btn btn--secondary btn--sm" onClick={() => { setI((i + 1) % cards.length); setFlipped(false); }}>Next</button>
      </div>
    </section>
  );
}
