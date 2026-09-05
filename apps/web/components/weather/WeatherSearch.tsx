'use client';

import { useState } from 'react';

interface WeatherSearchProps {
  onSearch: (city: string) => void;
  placeholder?: string;
  defaultValue?: string;
}

export default function WeatherSearch({
  onSearch,
  placeholder = 'e.g. Mumbai',
  defaultValue = '',
}: WeatherSearchProps) {
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const city = value.trim();
    if (city) onSearch(city);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full gap-2 sm:max-w-md"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Search
      </button>
    </form>
  );
}