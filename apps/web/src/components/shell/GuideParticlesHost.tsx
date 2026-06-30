import { useEffect, type ReactElement } from "react";
import { createIdleGuideCanvasController } from "../../visual/guide-particles";

export function GuideParticlesHost(): ReactElement {
	useEffect(() => {
		const controller = createIdleGuideCanvasController();
		controller.start();
		return () => controller.dispose();
	}, []);

	return (
		<>
			<canvas id="idle-guide-canvas" aria-hidden="true" />
			<canvas id="login-guide-canvas" aria-hidden="true" />
		</>
	);
}
