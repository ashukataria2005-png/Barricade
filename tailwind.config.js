/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bgDark: '#121214',
                cardDark: '#1c1c1e',
                borderDark: '#2c2c2e',
                brandOrange: '#f59e0b',
                brandGreen: '#22c55e',
            }
        },
    },
    plugins: [],
}