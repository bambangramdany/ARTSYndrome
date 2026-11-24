'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { searchPlaces } from '../lib/placeSearch';

// Isian kota dengan saran 514 kabupaten/kota Indonesia (pola combobox ARIA 1.2).
// Saran hanya membantu: tamu tetap boleh mengetik bebas, misalnya kota di luar negeri.
export default function CityInput({ id, value, onChange, maxLength = 80 }) {
  const listId = useId();
  const hintId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const blurTimer = useRef(null);

  const items = useMemo(() => {
    const v = value.trim();
    if (v.length < 2) return [];
    const found = searchPlaces(v, 8);
    // Sudah memilih/mengetik persis salah satu saran: tidak perlu daftar lagi.
    if (found.length === 1 && found[0].name.toLowerCase() === v.toLowerCase()) return [];
    return found;
  }, [value]);
  const show = open && items.length > 0;

  function choose(item) {
    onChange(item.name);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      setActive((i) => (items.length ? (i + 1) % items.length : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (items.length ? (i <= 0 ? items.length - 1 : i - 1) : -1));
    } else if (e.key === 'Enter' && show && active >= 0) {
      e.preventDefault();
      choose(items[active]);
    } else if (e.key === 'Escape' && show) {
      e.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <div className="combo">
      <input
        id={id}
        className="input"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={show}
        aria-controls={listId}
        aria-activedescendant={show && active >= 0 ? `${listId}-${active}` : undefined}
        aria-describedby={hintId}
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        value={value}
        maxLength={maxLength}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 120); }}
        onKeyDown={onKeyDown}
      />
      <ul id={listId} role="listbox" aria-label="Saran kabupaten/kota" className="combo-list" hidden={!show}>
        {items.map((it, i) => (
          <li
            key={it.name}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            className="combo-opt"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { clearTimeout(blurTimer.current); choose(it); }}
          >
            <span>{it.name}</span>
            <span className="combo-prov">{it.province}</span>
          </li>
        ))}
      </ul>
      <p id={hintId} className="combo-hint">Pilih dari saran, atau ketik sendiri bila dari luar Indonesia (contoh: Singapura).</p>
    </div>
  );
}
