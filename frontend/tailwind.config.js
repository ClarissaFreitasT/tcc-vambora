export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#00B4D8',
        'primary-dark': '#0077B6',
        accent: '#FFB703',
        'bg-primary': '#F8FAFC',
        'bg-secondary': '#FFFFFF',
        'text-primary': '#0F172A',
        'text-secondary': '#64748B',
        border: '#E2E8F0',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'h1': ['56px', { lineHeight: '64px' }],
        'h2': ['40px', { lineHeight: '48px' }],
        'h3': ['32px', { lineHeight: '40px' }],
        'body': ['16px', { lineHeight: '24px' }],
        'small': ['14px', { lineHeight: '20px' }],
      },
      maxWidth: {
        container: '1280px',
        page: '1440px',
      },
      spacing: {
        gutter: '24px',
      },
      borderRadius: {
        input: '12px',
        card: '20px',
        button: '999px',
        modal: '24px',
      },
      boxShadow: {
        card: '0 4px 20px rgba(0,0,0,0.06)',
        'card-hover': '0 10px 30px rgba(0,0,0,0.10)',
        'btn-primary': '0 8px 16px rgba(0, 180, 216, 0.20)',
      },
    },
  },
  plugins: [],
}
