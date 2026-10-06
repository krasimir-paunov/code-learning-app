import { accessibleName, role } from '../shared/a11y/a11y.ts';

/** What the image is for, which decides what its alt text should be. */
export type ImagePurpose = 'informative' | 'decorative' | 'link';

export interface LabImage {
  id: string;
  file: string;
  purpose: ImagePurpose;
  /** Where the link goes, for link images. */
  linkTo?: string;
  /** Shown as a caption in the editor: what the picture shows. */
  shows: string;
}

/** null = no alt attribute at all; '' = alt="". */
export type AltValue = string | null;

const escape = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

export function imgTag(image: LabImage, alt: AltValue): string {
  const altAttr = alt === null ? '' : ` alt="${escape(alt)}"`;
  const img = `<img src="${image.file}"${altAttr}>`;
  return image.purpose === 'link' && image.linkTo ? `<a href="${image.linkTo}">${img}</a>` : img;
}

export interface AltVerdict {
  /** What a screen reader gets, roughly in the order it says it. */
  announced: string;
  ok: boolean;
  advice: string;
}

/** Judges one alt choice against the image's purpose, using the accessibility model. */
export function judgeAlt(image: LabImage, alt: AltValue): AltVerdict {
  const doc = new DOMParser().parseFromString(imgTag(image, alt), 'text/html');
  const img = doc.querySelector('img') as Element;
  const r = role(img);
  const name = accessibleName(img);
  const link = doc.querySelector('a');
  const linkName = link ? accessibleName(link) : '';
  const fileFallback = `"${image.file}" (no alt: many screen readers read the file name)`;
  const text = alt?.trim() ?? '';
  const looksLikeFile = /\.(jpe?g|png|gif|webp|avif|svg)$/i.test(text);
  const redundant = /^(image|picture|photo|graphic|icon) (of|showing)\b/i.test(text);

  let announced: string;
  if (link) announced = `link, ${linkName || (alt === null ? fileFallback : '(no name)')}`;
  else if (r === 'presentation') announced = '(skipped: decorative)';
  else announced = `${name || (alt === null ? fileFallback : '(no name)')}, image`;

  const verdict = (ok: boolean, advice: string): AltVerdict => ({ announced, ok, advice });
  if (alt === null)
    return verdict(false, 'Every image needs an alt attribute, even if it is empty.');
  if (looksLikeFile)
    return verdict(false, 'A file name describes nothing. Say what the image shows or does.');
  switch (image.purpose) {
    case 'decorative':
      return text
        ? verdict(
            false,
            'This image adds nothing to the content. alt="" lets screen readers skip it.',
          )
        : verdict(true, 'Decorative: alt="" removes it from the accessibility tree.');
    case 'link':
      if (!text)
        return verdict(
          false,
          'The image is the only content of the link, so the link has no name.',
        );
      return verdict(
        true,
        `The alt text is the link's name; make sure it says where it goes (${image.linkTo}).`,
      );
    case 'informative':
      if (!text) return verdict(false, 'alt="" hides an image that carries information.');
      if (redundant)
        return verdict(false, 'Screen readers already say "image". Start with what it shows.');
      return verdict(true, 'Describes what the image shows, concisely.');
  }
}
