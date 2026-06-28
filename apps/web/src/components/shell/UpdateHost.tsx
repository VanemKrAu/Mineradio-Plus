import { type ReactElement } from "react";
import type { UpdateState } from "../../stores/update-store";

export interface UpdateHostProps {
	state: UpdateState;
	open: boolean;
	onOpen: () => void;
	onClose: () => void;
	onCheck: () => void;
}

export function shouldShowUpdateEntry(state: Pick<UpdateState, "status" | "version" | "error">): boolean {
	return state.status === "checking" || state.status === "available" || state.status === "error" || !!state.version;
}

function updateEntryClass(state: UpdateState): string {
	const classes = ["update-entry"];
	if (shouldShowUpdateEntry(state)) classes.push("available");
	if (state.status === "checking" || state.status === "downloading" || state.status === "installing") classes.push("downloading");
	if (state.installState === "ready-to-download") classes.push("ready");
	return classes.join(" ");
}

function updateModalClass(state: UpdateState): string {
	const classes = ["modal", "update-modal"];
	if (state.installState === "ready-to-download") classes.push("ready");
	if (state.status === "error" || state.signatureGate) classes.push("error");
	return classes.join(" ");
}

function updateHeroText(state: UpdateState): string {
	if (state.signatureGate) return "发现新版本，但 Tauri 更新签名密钥尚未配置。";
	if (state.status === "checking") return "正在检查更新。";
	if (state.status === "error") return state.message || state.error || "更新检测失败。";
	if (state.status === "not-available") return "当前版本已是最新。";
	if (state.status === "available") return state.message || "发现新版本，建议更新。";
	return state.message || "更新检测已就绪。";
}

function updateNotes(state: UpdateState): string[] {
	const raw = state.body || state.message || "";
	const notes = raw
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)
		.slice(0, 4);
	if (state.signatureGate) {
		return [
			"签名密钥未配置，当前构建不会下载或安装更新。",
			...notes,
		].slice(0, 4);
	}
	if (notes.length > 0) return notes;
	if (state.status === "error") return [state.error || "更新检测失败"];
	return ["更新检测已就绪"];
}

function primaryLabel(state: UpdateState): string {
	if (state.status === "checking") return "正在检查";
	if (state.signatureGate) return "暂不可安装";
	if (state.status === "error") return "重新检查";
	if (state.status === "available") return "检查更新";
	if (state.status === "not-available") return "重新检查";
	return "检查更新";
}

function footnote(state: UpdateState): string {
	if (state.signatureGate) return "签名密钥未配置前，Tauri 主线只展示更新信息，不执行下载或安装。";
	if (state.status === "error") return state.error || "请稍后重试。";
	if (state.status === "available") return "安装流程会通过 Tauri updater 执行。";
	if (state.status === "checking") return "正在连接更新通道。";
	return "当前版本检测状态会显示在这里。";
}

export function UpdateHost({ state, open, onOpen, onClose, onCheck }: UpdateHostProps): ReactElement | null {
	if (!shouldShowUpdateEntry(state) && !open) return null;
	const version = state.version || state.currentVersion || "0.0.0";
	const disabled = state.status === "checking" || state.signatureGate;
	return (
		<>
			<button
				id="update-entry"
				className={updateEntryClass(state)}
				type="button"
				onClick={onOpen}
				title="发现新版本"
				aria-label="发现新版本"
			>
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<circle className="update-ring" cx="12" cy="12" r="8.8" />
					<circle id="update-progress-ring" className="update-progress-ring" cx="12" cy="12" r="8.8" />
					<path className="update-arrow" d="M12 16.5V7.5" />
					<path className="update-arrow" d="M8.7 10.7 12 7.4l3.3 3.3" />
				</svg>
			</button>
			<div id="update-modal" className={open ? "modal-mask show" : "modal-mask"} role="presentation" onClick={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}>
				<div className={updateModalClass(state)} role="dialog" aria-modal="true" aria-labelledby="update-modal-version">
					<div className="update-panel-inner">
						<div className="update-panel-head">
							<div>
								<div className="update-kicker">MINERADIO</div>
								<div id="update-modal-title" className="update-title">New release</div>
								<div id="update-modal-version" className="update-version">v{version}</div>
							</div>
						</div>
						<div className="update-hero">
							<div id="update-hero-main" className="update-hero-main">{updateHeroText(state)}</div>
						</div>
						<div id="update-list" className="update-list">
							{updateNotes(state).map((text, index) => (
								<div className="update-item" key={`${index}:${text}`}>
									<span className="update-item-dot" data-index={String(index + 1).padStart(2, "0")} />
									<div className="update-item-text">{text}</div>
								</div>
							))}
						</div>
						<div className="update-actions">
							<button id="update-primary-btn" className="update-primary-btn" type="button" onClick={onCheck} disabled={disabled}>
								<span id="update-btn-fill" className="update-btn-fill" />
								<span id="update-btn-label" className="update-btn-label">{primaryLabel(state)}</span>
							</button>
							<button className="update-secondary-btn" type="button" onClick={onClose}>取消</button>
						</div>
						<div id="update-footnote" className="update-footnote">{footnote(state)}</div>
					</div>
				</div>
			</div>
		</>
	);
}
