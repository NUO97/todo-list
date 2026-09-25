interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <input
      type="search"
      className="search-bar"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search tasks..."
      aria-label="Search tasks"
    />
  );
}
