/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Montserrat', 'sans-serif'],
                serif: ['Cormorant Garamond', 'serif'],
                display: ['Cinzel', 'serif'],
            },
            colors: {
                gold: '#c5a059', /* More desaturated champagne gold */
                'gold-light': '#e6dace',
                'dark-bg': '#080808',
                'off-white': '#fcfcfc'
            },
            letterSpacing: {
                'widest-xl': '0.3em',
                'mega': '0.5em',
            },
            fontSize: {
                '10xl': '10rem',
                '12xl': '12rem',
            }
        },
    },
    plugins: [],
}
