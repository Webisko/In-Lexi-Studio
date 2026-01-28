import * as prettierPluginTailwindcss from 'prettier-plugin-tailwindcss';

/** @type {import('prettier').Config} */
export default {
  plugins: [prettierPluginTailwindcss],
  singleQuote: true,
  semi: true,
  trailingComma: 'all',
  printWidth: 100,
};
