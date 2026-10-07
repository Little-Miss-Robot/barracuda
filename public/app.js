const review = document.querySelector('[data-review]');

if (review) {
    const buttons = review.querySelectorAll('[data-view]');

    const applyView = (view) => {
        review.dataset.mode = view;

        buttons.forEach((button) => {
            button.setAttribute('aria-pressed', String(button.dataset.view === view));
        });
    };

    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            if (button.dataset.view) {
                applyView(button.dataset.view);
            }
        });
    });

    review.querySelectorAll('input[data-opacity]').forEach((input) => {
        const top = input.closest('.overlay')?.querySelector('.overlay-top');

        const sync = () => {
            if (top instanceof HTMLElement) {
                top.style.opacity = String(Number(input.value) / 100);
            }
        };

        input.addEventListener('input', sync);
        sync();
    });
}

if (document.body.dataset.poll === 'true') {
    setTimeout(() => {
        window.location.reload();
    }, 2000);
}
