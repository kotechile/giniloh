(function () {
	const currentScript = document.currentScript;
	let baseUrl = 'https://giniloh.com';
	if (currentScript && currentScript.src) {
		try {
			const urlObj = new URL(currentScript.src);
			baseUrl = urlObj.origin;
		} catch (e) {
			// fallback
		}
	}

	function initializeEmbeds() {
		const embeds = document.querySelectorAll('.giniloh-calculator-embed');
		embeds.forEach((container) => {
			if (container.getAttribute('data-initialized') === 'true') {
				return;
			}

			const slug = container.getAttribute('data-calculator');
			if (!slug) return;

			const iframe = document.createElement('iframe');
			iframe.src = `${baseUrl}/calculators/embed/${slug}/`;
			iframe.style.width = '100%';
			iframe.style.border = 'none';
			iframe.style.overflow = 'hidden';
			iframe.style.background = 'transparent';
			iframe.style.transition = 'height 0.2s ease-out';
			iframe.scrolling = 'no';
			iframe.setAttribute('frameborder', '0');

			const embedId = `giniloh-embed-${slug}-${Math.random().toString(36).substring(2, 11)}`;
			iframe.id = embedId;
			iframe.setAttribute('data-embed-id', embedId);

			// Append query param to iframe src to pass the embed ID
			const separator = iframe.src.includes('?') ? '&' : '?';
			iframe.src = `${iframe.src}${separator}embedId=${embedId}`;

			container.appendChild(iframe);
			container.setAttribute('data-initialized', 'true');
		});
	}

	// Initialize on load
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initializeEmbeds);
	} else {
		initializeEmbeds();
	}

	// Listen for resize messages from embeds
	window.addEventListener('message', (event) => {
		if (event.data && event.data.type === 'giniloh-resize') {
			const { height, embedId } = event.data;
			if (height) {
				const targetIframe = document.querySelector(`iframe[data-embed-id="${embedId}"]`);
				if (targetIframe) {
					targetIframe.style.height = `${height}px`;
				}
			}
		}
	});
})();
