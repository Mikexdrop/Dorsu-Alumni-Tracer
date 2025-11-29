import React from 'react';

export default function FacebookIcon({ size = 40, style = {} }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} style={style} aria-hidden>
      <path fill="currentColor" d="M22 12.07C22 6.48 17.52 2 11.93 2S2 6.48 2 12.07C2 17.06 5.66 21.13 10.44 21.95v-6.96H7.9v-2.92h2.54V9.84c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.23.2 2.23.2v2.45h-1.25c-1.23 0-1.61.77-1.61 1.56v1.88h2.74l-.44 2.92h-2.3V21.95C18.34 21.13 22 17.06 22 12.07z" />
    </svg>
  );
}
