// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Tabs } from './Tabs.tsx';

function Harness() {
  const [value, setValue] = useState('js');
  return (
    <Tabs
      label="Language"
      value={value}
      onChange={setValue}
      tabs={[
        { id: 'js', label: 'JavaScript', content: 'js panel' },
        { id: 'cs', label: 'C#', content: 'cs panel' },
        { id: 'ts', label: 'TypeScript', content: 'ts panel' },
      ]}
    />
  );
}

describe('Tabs', () => {
  it('moves selection with arrow keys, Home and End, keeping one tab stop', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const [js, cs, ts] = screen.getAllByRole('tab');

    expect(js).toHaveAttribute('aria-selected', 'true');
    expect(cs).toHaveAttribute('tabindex', '-1');

    await user.tab();
    expect(js).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(cs).toHaveFocus();
    expect(cs).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('cs panel');

    await user.keyboard('{End}');
    expect(ts).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(js).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(ts).toHaveAttribute('aria-selected', 'true');
  });
});
