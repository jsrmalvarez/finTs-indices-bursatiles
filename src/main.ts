import './styles.css';
import { createApp } from './ui/app';

const root = document.querySelector<HTMLElement>('#app');
if (!root) {
  throw new Error('No se encontró #app');
}

createApp(root);
