import { Map as MapIcon } from 'lucide-react';
import { LinkButton } from '../components/Button.tsx';
import { Glitch } from '../effects/Glitch.tsx';
import styles from './NotFoundPage.module.css';
import { useDocumentTitle } from './use-document-title.ts';

export function NotFoundPage() {
  useDocumentTitle('Not found');
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        <Glitch text="404" />
        <span className="visually-hidden">: page not found</span>
      </h1>
      <p className={styles.text}>There is nothing at this address. The map has every lesson.</p>
      <div className={styles.actions}>
        <LinkButton to="/map" variant="primary" icon={<MapIcon />}>
          Open the map
        </LinkButton>
        <LinkButton to="/">Home</LinkButton>
      </div>
    </div>
  );
}
