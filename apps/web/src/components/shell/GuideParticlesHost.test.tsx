import { expect, test } from "bun:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GuideParticlesHost } from "./GuideParticlesHost";

test("GuideParticlesHost renders the baseline login and idle guide canvases", () => {
	const html = renderToStaticMarkup(React.createElement(GuideParticlesHost));
	expect(html).toContain('id="login-guide-canvas"');
	expect(html).toContain('id="idle-guide-canvas"');
	expect(html).toContain('aria-hidden="true"');
});
