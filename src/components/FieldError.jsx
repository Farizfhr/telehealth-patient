import React from 'react';
import { toSafeText } from '../utils/formLogic';

export default function FieldError({ message }) {
  const text = toSafeText(message);
  if (!text) return null;

  return (
    <p
      role="alert"
      className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-error bg-error-container/60 px-3 py-1.5 rounded-xl"
    >
      <span className="material-symbols-outlined text-[15px] shrink-0">error</span>
      <span>{text}</span>
    </p>
  );
}
