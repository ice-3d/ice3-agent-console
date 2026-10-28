import '../../public/styles.css';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('ICE3 Agent Console root is missing');

root.innerHTML = '<main id="stage" aria-busy="true"></main>';
