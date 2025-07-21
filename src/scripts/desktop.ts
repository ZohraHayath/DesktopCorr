import '../styles/desktop.css'

const cortexIcon = document.getElementById('cortex-icon') as HTMLElement;
const readmeIcon = document.getElementById('readme-icon') as HTMLElement;
const readmeModalBackdrop = document.getElementById('readme-modal-backdrop') as HTMLElement;
const closeReadmeBtn = document.getElementById('close-readme-btn') as HTMLElement;

function playDesktopSound(soundName: string) {
    new Audio(`/sounds/${soundName}`).play().catch(error => console.error(`Audio Error: ${soundName}`, error));
}

readmeIcon.addEventListener('click', () => {
    playDesktopSound('desktop_click.m4a');
    readmeModalBackdrop.classList.remove('hidden');
});
closeReadmeBtn.addEventListener('click', () => {
    playDesktopSound('desktop_click.m4a');
    readmeModalBackdrop.classList.add('hidden');
});
readmeModalBackdrop.addEventListener('click', (e) => {
    if (e.target === readmeModalBackdrop) {
        playDesktopSound('desktop_click.m4a');
        readmeModalBackdrop.classList.add('hidden');
    }
});

cortexIcon.addEventListener('click', () => {
    // Navigate to the cortex game page
    window.location.href = '/src/cortex.html';
});