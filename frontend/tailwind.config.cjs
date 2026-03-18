module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#f5eee3',
        ink: '#16211d',
        forest: '#254640',
        ember: '#cc653f',
        sun: '#f1c66d',
        slate: '#3f4f5b',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Space Grotesk', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        float: '0 28px 90px -36px rgba(22, 33, 29, 0.45)',
      },
      backgroundImage: {
        mesh: 'radial-gradient(circle at top left, rgba(241, 198, 109, 0.45), transparent 28%), radial-gradient(circle at 85% 12%, rgba(204, 101, 63, 0.22), transparent 25%), linear-gradient(135deg, #f5eee3 0%, #fbf8f3 48%, #eef1ea 100%)',
      },
    },
  },
  plugins: [],
};
