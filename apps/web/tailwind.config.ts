import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        rainfall: '#3388ff',
        flood: '#0000cc',
        thunderstorm: '#ffcc00',
        heatwave: '#ff4444',
        'strong-wind': '#44cc44',
        cyclone: '#9933cc',
        drought: '#ff8800',
        other: '#888888',
      },
    },
  },
  plugins: [],
};

export default config;
