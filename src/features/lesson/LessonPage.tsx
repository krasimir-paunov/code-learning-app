import { Map as MapIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { lessonLoaders } from 'virtual:content/lessons';
import { useDocumentTitle } from '../../app/use-document-title.ts';
import { LinkButton } from '../../components/Button.tsx';
import { EmptyState } from '../../components/EmptyState.tsx';
import { ErrorScreen } from '../../components/ErrorScreen.tsx';
import { TerminalLoader } from '../../effects/TerminalLoader.tsx';
import { manifest } from '../../engine/content/manifest.ts';
import type { CompiledLesson } from '../../engine/content/lesson-types.ts';
import { stripBackticks } from '../../engine/content/text.ts';
import { LessonPlayer } from './LessonPlayer.tsx';

type Load = { id: string; lesson?: CompiledLesson; error?: boolean };

export function LessonPage() {
  const { lessonId = '' } = useParams();
  const node = manifest.nodes[lessonId];
  const [load, setLoad] = useState<Load>({ id: '' });
  useDocumentTitle(node ? stripBackticks(node.title) : 'Lesson not found');

  useEffect(() => {
    const loader = lessonLoaders[lessonId];
    if (!loader) return;
    let current = true;
    loader().then(
      (module) => current && setLoad({ id: lessonId, lesson: module.default }),
      () => current && setLoad({ id: lessonId, error: true }),
    );
    return () => {
      current = false;
    };
  }, [lessonId]);

  if (!node) {
    return (
      <EmptyState
        level={1}
        title="Lesson not found"
        actions={
          <LinkButton to="/map" icon={<MapIcon />}>
            Open the map
          </LinkButton>
        }
      >
        There is no lesson called “{lessonId}”.
      </EmptyState>
    );
  }
  if (!node.published) {
    return (
      <EmptyState
        level={1}
        title={`${stripBackticks(node.title)}: coming soon`}
        actions={
          <LinkButton to={`/map/${node.module}`} icon={<MapIcon />}>
            Back to the map
          </LinkButton>
        }
      >
        This lesson is planned and on the map, but not built yet.
      </EmptyState>
    );
  }
  if (load.id === lessonId && load.error) {
    return (
      <ErrorScreen
        title="The lesson could not load"
        message="You may be offline, or a new version was just published."
      />
    );
  }
  if (load.id !== lessonId || !load.lesson)
    return <TerminalLoader line={`loading lesson ${lessonId}`} />;
  return <LessonPlayer key={lessonId} lesson={load.lesson} node={node} />;
}
