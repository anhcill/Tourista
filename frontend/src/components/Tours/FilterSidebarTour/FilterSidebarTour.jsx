'use client';

import { useState } from 'react';
import styles from './FilterSidebarTour.module.css';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const DIFFICULTY = ['EASY', 'MEDIUM', 'HARD'];

function CollapsibleSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={styles.section}>
      <button className={styles.sectionHeader} onClick={() => setOpen(!open)}>
        <span>{title}</span>
        {open ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
      </button>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </div>
  );
}

export default function FilterSidebarTour({ filters, onChange }) {
  const [local, setLocal] = useState({
    minPrice: Number(filters?.minPrice || 0),
    maxPrice: Number(filters?.maxPrice || 10000000),
    durationMin: Number(filters?.durationMin || 1),
    durationMax: Number(filters?.durationMax || 7),
    difficulty: filters?.difficulty || '',
  });

  const applyPatch = (patch) => {
    const next = { ...local, ...patch };
    setLocal(next);
    if (onChange) {
      onChange(next);
    }
  };

  return (
    <aside className={styles.sidebar}>
      <h3 className={styles.sidebarTitle}>Loc theo</h3>

      <CollapsibleSection title="Gia moi nguoi">
        <div className={styles.grid2}>
          <label>
            Tu
            <input
              type="number"
              className={styles.input}
              min={0}
              value={local.minPrice}
              onChange={(e) => applyPatch({ minPrice: Number(e.target.value) })}
            />
          </label>
          <label>
            Den
            <input
              type="number"
              className={styles.input}
              min={local.minPrice}
              value={local.maxPrice}
              onChange={(e) => applyPatch({ maxPrice: Number(e.target.value) })}
            />
          </label>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Thoi luong tour">
        <div className={styles.grid2}>
          <label>
            Tu ngay
            <input
              type="number"
              className={styles.input}
              min={1}
              value={local.durationMin}
              onChange={(e) => applyPatch({ durationMin: Number(e.target.value) })}
            />
          </label>
          <label>
            Den ngay
            <input
              type="number"
              className={styles.input}
              min={local.durationMin}
              value={local.durationMax}
              onChange={(e) => applyPatch({ durationMax: Number(e.target.value) })}
            />
          </label>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Muc do kho" defaultOpen={false}>
        <ul className={styles.checkList}>
          <li>
            <label className={styles.checkLabel}>
              <input
                type="radio"
                name="difficulty"
                checked={local.difficulty === ''}
                onChange={() => applyPatch({ difficulty: '' })}
              />
              <span>Tat ca</span>
            </label>
          </li>
          {DIFFICULTY.map((value) => (
            <li key={value}>
              <label className={styles.checkLabel}>
                <input
                  type="radio"
                  name="difficulty"
                  checked={local.difficulty === value}
                  onChange={() => applyPatch({ difficulty: value })}
                />
                <span>{value}</span>
              </label>
            </li>
          ))}
        </ul>
      </CollapsibleSection>
    </aside>
  );
}
