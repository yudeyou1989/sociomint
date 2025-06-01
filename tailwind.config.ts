import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#0de5ff', // 主要亮色 - 霓虹青色
        'secondary': '#8b3dff', // 次要亮色 - 紫色
        'accent': '#20caff', // 强调色 - 电光蓝
        'dark-bg': '#0d1117', // 深色背景
        'darker-bg': '#080c12', // 更深色背景
        'card-bg': '#161b22', // 卡片背景色
        'border-dark': '#30363d', // 边框深色
      },
      boxShadow: {
        'neon': '0 0 15px rgba(13, 229, 255, 0.5)',
        'neon-hover': '0 0 25px rgba(13, 229, 255, 0.8)',
      },
      animation: {
        'glow': 'glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(13, 229, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(13, 229, 255, 0.8), 0 0 30px rgba(139, 61, 255, 0.5)' },
        }
      }
    },
  },
  plugins: [],
};
export default config; 