document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.getElementById('main-nav');

    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', () => {
            const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
            mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
            mainNav.classList.toggle('active');
        });

        // Close menu when clicking outside (opcional, melhora UX)
        document.addEventListener('click', (e) => {
            if (!mobileMenuBtn.contains(e.target) && !mainNav.contains(e.target)) {
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                mainNav.classList.remove('active');
            }
        });
    }

    // 2. Smooth Scroll para Links Âncora
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Fechar menu mobile ao clicar em um link
                if (mainNav && mainNav.classList.contains('active')) {
                    mobileMenuBtn.setAttribute('aria-expanded', 'false');
                    mainNav.classList.remove('active');
                }

                // Scroll suave levando em conta a altura do header fixo
                const headerOffset = 70; // Altura aproximada do header
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 3. Validação Básica do Formulário de Newsletter
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email');
            if (emailInput && emailInput.value) {
                // Simulação de envio
                const originalBtnText = newsletterForm.querySelector('button').textContent;
                newsletterForm.querySelector('button').textContent = 'Inscrito! ✓';
                emailInput.value = '';
                
                setTimeout(() => {
                    newsletterForm.querySelector('button').textContent = originalBtnText;
                }, 3000);
            }
        });
    }
});
