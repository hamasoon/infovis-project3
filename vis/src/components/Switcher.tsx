export type SwitcherMode = 'honest' | 'bad';

type SwitcherProps = {
  mode: SwitcherMode;
  onChange: (mode: SwitcherMode) => void;
};

export function Switcher({ mode, onChange }: SwitcherProps) {
  return (
    <div className="switcher">
      <button className={mode === 'honest' ? 'btn active' : 'btn'} onClick={() => onChange('honest')}>
        정직한 그래프
      </button>
      <button className={mode === 'bad' ? 'btn active' : 'btn'} onClick={() => onChange('bad')}>
        왜곡된 그래프
      </button>
    </div>
  );
}
