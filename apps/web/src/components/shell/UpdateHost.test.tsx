import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { UpdateHost, shouldShowUpdateEntry } from "./UpdateHost";
import type { UpdateState } from "../../stores/update-store";

function updateState(overrides: Partial<UpdateState> = {}): UpdateState {
	return {
		status: "idle",
		version: null,
		currentVersion: "0.1.0",
		body: null,
		message: null,
		date: null,
		error: null,
		requiresSignature: true,
		signatureGate: true,
		installState: "signature-key-missing",
		setStatus: () => {},
		setVersion: () => {},
		setMessage: () => {},
		applyCheckResult: () => {},
		reset: () => {},
		...overrides,
	};
}

test("shouldShowUpdateEntry follows baseline hidden-until-actionable update entry behavior", () => {
	expect(shouldShowUpdateEntry(updateState())).toBe(false);
	expect(shouldShowUpdateEntry(updateState({ status: "checking" }))).toBe(true);
	expect(shouldShowUpdateEntry(updateState({ status: "available", version: "0.2.0" }))).toBe(true);
	expect(shouldShowUpdateEntry(updateState({ status: "error", error: "UPDATER_CHECK_FAILED" }))).toBe(true);
	expect(shouldShowUpdateEntry(updateState({ status: "not-available" }))).toBe(false);
});

test("UpdateHost renders baseline entry and signature-gated modal copy", () => {
	const html = renderToStaticMarkup(
		<UpdateHost
			state={updateState({
				status: "available",
				version: "0.2.0",
				currentVersion: "0.1.0",
				message: "新版更新说明",
				body: "修复播放链路\n优化 3D 歌单架",
				signatureGate: true,
				installState: "signature-key-missing",
			})}
			open
			onOpen={() => {}}
			onClose={() => {}}
			onCheck={() => {}}
		/>
	);
	expect(html).toContain('id="update-entry"');
	expect(html).toContain("available");
	expect(html).toContain('id="update-modal"');
	expect(html).toContain("v0.2.0");
	expect(html).toContain("修复播放链路");
	expect(html).toContain("签名密钥未配置");
	expect(html).toContain("暂不可安装");
});
