import { LiveEditor } from '../../components/live-editor/LiveEditor.tsx';
import type { VisualizerViewProps } from '../contract.ts';
import type { LiveEditorProps } from './build.ts';

export default function LiveEditorView({ props }: VisualizerViewProps<LiveEditorProps>) {
  return (
    <LiveEditor initialFiles={props.files} editable={props.editable} preview={props.preview} />
  );
}
