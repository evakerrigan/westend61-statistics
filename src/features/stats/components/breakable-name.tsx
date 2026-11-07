import { Fragment } from 'react';

// Words agency names are often glued from, e.g. «Plainpicture», «TopPhotoGroup».
const NAME_PARTS = /(picture|photo|group|images|image|stock|pics)/gi;

/**
 * Renders a one-word name with line-break opportunities (`<wbr>`) at its
 * inner word boundaries, so a narrow column can wrap it onto two lines.
 */
export const BreakableName = ({ name }: { name: string }) => {
  const marked = name
    // Before an inner capital: «TopPhoto» -> «Top|Photo».
    .replace(/([a-zа-яё])(?=[A-ZА-ЯЁ])/g, '$1\u0000')
    // Before a known part not at the start: «Plainpicture» -> «Plain|picture».
    .replace(NAME_PARTS, (part, _p, offset: number) =>
      offset > 0 ? `\u0000${part}` : part
    );
  const pieces = marked.split('\u0000').filter(Boolean);
  return (
    <>
      {pieces.map((piece, i) => (
        <Fragment key={i}>
          {i > 0 && <wbr />}
          {piece}
        </Fragment>
      ))}
    </>
  );
};
