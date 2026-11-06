/* User-provided HilltopAds tags. Load only on the Paperkind workspace. */
(function () {
  'use strict';
  const banner = document.getElementById('ad-banner');
  const creative = document.getElementById('banner-creative');
  const viewport = document.getElementById('banner-viewport');
  const close = document.getElementById('close-ad');
  const integration = document.getElementById('hilltopads-integration');
  if (!banner || !creative || !viewport || !close || !integration) return;

  // HILLTOPADS_BANNER_START: User-provided banner; one load per page visit.
  let dismissed = false;
  let frame = 0;
  function fitBanner() {
    frame = 0;
    if (dismissed) return;
    const width = creative.scrollWidth;
    const height = creative.offsetHeight;
    const filled = width > 0 && height > 0;
    const scale = filled ? Math.min(1, viewport.clientWidth / width, 180 / height) : 1;
    creative.style.setProperty('--ad-scale', String(scale));
    viewport.style.height = `${Math.ceil(height * scale)}px`;
    banner.dataset.empty = String(!filled);
    banner.inert = !filled;
  }
  function scheduleFit() {
    if (!dismissed && !frame) frame = requestAnimationFrame(fitBanner);
  }
  close.addEventListener('click', () => {
    dismissed = true;
    banner.classList.add('is-dismissed');
    banner.inert = true;
  });
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(scheduleFit).observe(creative);
  new MutationObserver(scheduleFit).observe(creative, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['width', 'height']
  });
  window.addEventListener('resize', scheduleFit);
  fitBanner();
  const script = document.createElement('script');
  script.id = 'hilltopads-banner-loader';
  script.dataset.adStatus = 'loading';
  script.settings = {};
  script.src = 'https://shameful-farm.com/buXUV.std-GUlD0YYIWacz/PeSmC9OuKZGU-lGkPPiTccm2bMbDoAQ0cNNDVEztENnzbYUwzMFDHQ/0tN/Qg';
  script.async = true;
  script.referrerPolicy = 'no-referrer-when-downgrade';
  script.addEventListener('load', () => { script.dataset.adStatus = 'loaded'; scheduleFit(); });
  script.addEventListener('error', () => { script.dataset.adStatus = 'error'; });
  creative.appendChild(script);
  // HILLTOPADS_BANNER_END

  // HILLTOPADS_POPUP_START: Direct offer URL, not a script URL.
  const offerUrl = 'https://bold-consequence.com/bK3wV.0lP/3SpFvKbKmQVOJRZjDf0/3tN/jGAowANzDiMez-LOTgch2sMGDbAT0/Mzz/cj';
  let attempted = false;
  document.addEventListener('click', event => {
    const button = event.target.closest && event.target.closest('#download-pdf, #download-svg');
    if (attempted || !event.isTrusted || !button || button.disabled) return;
    attempted = true;
    integration.dataset.popupStatus = 'attempted';
    // Run within the user's click before asynchronous operations consume the gesture.
    // Do not cancel the original PDF or SVG download action.
    try {
      window.open(offerUrl, '_blank', 'noopener,noreferrer');
    } catch {
      integration.dataset.popupStatus = 'error';
    }
  }, { capture: true });
  // HILLTOPADS_POPUP_END
})();
