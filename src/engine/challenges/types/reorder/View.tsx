import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';
import { useState } from 'react';
import { IconButton } from '../../../../components/IconButton.tsx';
import { cx } from '../../../../components/cx.ts';
import { useMotionPreference } from '../../../../effects/motion.ts';
import type { ChallengeViewProps } from '../../contract.ts';
import { CheckButton } from '../../shared/CheckButton.tsx';
import styles from '../../shared/challenge.module.css';
import type { ReorderAnswer, ReorderSpec } from './index.ts';
import local from './View.module.css';

interface RowProps {
  id: string;
  html: string;
  index: number;
  count: number;
  code: boolean;
  excluded: boolean;
  flagged: boolean;
  canExclude: boolean;
  disabled: boolean;
  move: (from: number, to: number) => void;
  toggleExcluded: () => void;
}

function SortableRow(props: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.id,
    disabled: props.disabled,
  });
  const motion = useMotionPreference();
  return (
    <li
      ref={setNodeRef}
      className={cx(
        local.row,
        isDragging && local.dragging,
        props.flagged && local.flagged,
        props.excluded && local.excluded,
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: motion === 'full' ? transition : undefined,
      }}
    >
      <button
        type="button"
        className={local.handle}
        aria-label={`Drag item ${props.index + 1}. Press Space to pick up, arrow keys to move, Space to drop.`}
        disabled={props.disabled}
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" />
      </button>
      <span className={local.position} aria-hidden="true">
        {props.index + 1}
      </span>
      <span
        className={cx(local.content, props.code && local.code)}
        // Build-time HTML from repository content.
        dangerouslySetInnerHTML={{ __html: props.html }}
      />
      <span className={local.actions}>
        {props.canExclude && (
          <label className={local.exclude}>
            <input
              type="checkbox"
              checked={props.excluded}
              onChange={props.toggleExcluded}
              disabled={props.disabled}
            />
            Not needed
          </label>
        )}
        <IconButton
          label={`Move item ${props.index + 1} up`}
          icon={<ArrowUp />}
          disabled={props.disabled || props.index === 0}
          onClick={() => props.move(props.index, props.index - 1)}
        />
        <IconButton
          label={`Move item ${props.index + 1} down`}
          icon={<ArrowDown />}
          disabled={props.disabled || props.index === props.count - 1}
          onClick={() => props.move(props.index, props.index + 1)}
        />
      </span>
    </li>
  );
}

export default function ReorderView({
  spec,
  state,
  submit,
  disabled,
}: ChallengeViewProps<ReorderSpec, ReorderAnswer>) {
  const [order, setOrder] = useState(() => spec.items.map((i) => i.id));
  const [excluded, setExcluded] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const flagged = new Set(
    (state.lastResult?.highlight as { ids?: string[] } | undefined)?.ids ?? [],
  );
  const html = new Map(spec.items.map((i) => [i.id, i.html]));

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length) return;
    setOrder((current) => arrayMove(current, from, to));
    setAnnouncement(`Item moved to position ${to + 1} of ${order.length}.`);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    move(order.indexOf(String(active.id)), order.indexOf(String(over.id)));
  }

  return (
    <div className={styles.stack}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ol className={local.list}>
            {order.map((id, index) => (
              <SortableRow
                key={id}
                id={id}
                html={html.get(id) ?? ''}
                index={index}
                count={order.length}
                code={spec.code}
                excluded={excluded.includes(id)}
                flagged={flagged.has(id)}
                canExclude={spec.distractors.length > 0}
                disabled={disabled}
                move={move}
                toggleExcluded={() =>
                  setExcluded((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]))
                }
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>
      <div>
        <CheckButton onCheck={() => submit({ order, excluded })} disabled={disabled} />
      </div>
    </div>
  );
}
