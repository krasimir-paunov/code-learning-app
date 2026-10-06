import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import {
  bracketMatching,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language';
import { Compartment, EditorState } from '@codemirror/state';
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import { useEffect, useRef } from 'react';
import type { CodeEditorProps } from './CodeEditor.tsx';

/** Syntax colors come from the same semantic tokens as the build-time highlighter. */
const highlight = HighlightStyle.define([
  {
    tag: [t.keyword, t.controlKeyword, t.moduleKeyword, t.definitionKeyword],
    color: 'var(--code-keyword)',
  },
  { tag: [t.string, t.special(t.string), t.regexp], color: 'var(--code-string)' },
  { tag: [t.number, t.bool, t.null, t.atom, t.unit], color: 'var(--code-number)' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: 'var(--code-function)' },
  { tag: [t.propertyName, t.definition(t.propertyName)], color: 'var(--code-property)' },
  { tag: [t.tagName, t.angleBracket], color: 'var(--code-tag)' },
  { tag: [t.attributeName, t.className], color: 'var(--code-attribute)' },
  { tag: [t.typeName, t.namespace], color: 'var(--code-type)' },
  {
    tag: [t.comment, t.lineComment, t.blockComment],
    color: 'var(--code-comment)',
    fontStyle: 'italic',
  },
  { tag: [t.punctuation, t.operator, t.bracket, t.separator], color: 'var(--code-punctuation)' },
]);

const theme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'var(--code-bg)',
      color: 'var(--code-fg)',
      fontSize: 'var(--editor-font-size)',
      borderRadius: 'var(--radius-md)',
    },
    '&.cm-focused': { outline: 'var(--focus-width) solid var(--focus-ring)', outlineOffset: '2px' },
    '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: 'var(--lh-code)' },
    '.cm-content': { caretColor: 'var(--accent)', padding: 'var(--space-2) 0' },
    '.cm-cursor': { borderLeftColor: 'var(--accent)', borderLeftWidth: '2px' },
    '.cm-gutters': {
      backgroundColor: 'var(--code-bg)',
      color: 'var(--text-3)',
      border: 'none',
      borderRight: 'var(--border-width) solid var(--border)',
    },
    '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'var(--code-line-highlight)' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'color-mix(in oklch, var(--neon-cyan) 30%, transparent) !important',
    },
    '.cm-matchingBracket': { outline: 'var(--border-width) solid var(--border-strong)' },
  },
  { dark: true },
);

const LANGUAGES = { js: javascript, css, html } as const;

/** CodeMirror 6, loaded only when an editor is on screen (lazy chunk). */
export default function CodeMirrorEditor({
  value,
  onChange,
  language,
  label,
  readOnly = false,
  describedBy,
}: CodeEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const readOnlyCompartment = useRef(new Compartment());

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!host.current) return;
    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          history(),
          drawSelection(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          highlightActiveLine(),
          // Tab indents; Escape then Tab moves focus out (CodeMirror's built-in escape hatch).
          keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
          LANGUAGES[language](),
          syntaxHighlighting(highlight),
          theme,
          readOnlyCompartment.current.of(EditorState.readOnly.of(readOnly)),
          EditorView.contentAttributes.of({
            'aria-label': label,
            ...(describedBy ? { 'aria-describedby': describedBy } : {}),
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = editor;
    return () => {
      editor.destroy();
      view.current = null;
    };
    // The editor is created once per language; value and readOnly are synced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, label, describedBy]);

  // External changes (reset, reveal) replace the document without recreating the editor.
  useEffect(() => {
    const editor = view.current;
    if (!editor) return;
    const current = editor.state.doc.toString();
    if (current !== value) {
      editor.dispatch({ changes: { from: 0, to: current.length, insert: value } });
    }
  }, [value]);

  useEffect(() => {
    view.current?.dispatch({
      effects: readOnlyCompartment.current.reconfigure(EditorState.readOnly.of(readOnly)),
    });
  }, [readOnly]);

  return <div ref={host} />;
}
