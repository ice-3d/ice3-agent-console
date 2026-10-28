import '../../public/styles.css';
import { startConsole } from '../app/main.js';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('ICE3 Agent Console root is missing');

void startConsole(root);
