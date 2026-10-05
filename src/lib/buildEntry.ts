// Entry of the Vite library build only (see ADR-020). Importing the stylesheet here lets Vite extract it into
// dist/badfennec-todo.css, while index.ts, the source of the type declarations, stays free of CSS imports.
import './styles/todo.css';

export * from './index';
