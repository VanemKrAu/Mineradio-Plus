import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import { SidecarClient, SidecarClientError } from "../api/sidecar-client";
import { PlayerController } from "../audio/player-controller";
import { selectCurrentIndex } from "../lyrics/select-current-index";
import { useLyricsStore } from "../stores/lyrics-store";
import { usePlaybackStore } from "../stores/playback-store";
import { useProviderStore } from "../stores/provider-store";
import { useSearchStore } from "../stores/search-store";
import { useUiStore } from "../stores/ui-store";
import { getRuntimeConfig, type RuntimeConfig } from "../tauri/runtime";
import { BottomControlsHost } from "../components/shell/BottomControlsHost";
import { SearchShell } from "../components/shell/SearchShell";
import { TopRightControls } from "../components/shell/TopRightControls";
import { EmptyHomeHost } from "../home/EmptyHomeHost";
import { SplashHost } from "../visual/SplashHost";
import { VisualEngineHost } from "../visual/VisualEngineHost";
import { createShelfDetailContentLoader, playShelfDetailRow } from "../visual/shelf-detail-data";

const SHOW_SPLASH = import.meta.env.VITE_SPLASH !== "0";

function placeholderRuntimeConfig(): RuntimeConfig {
	return {
		sidecarBaseUrl: "",
		appDataDir: "",
		appVersion: "0.0.0-dev",
		schemaVersion: "0.1.0",
		updaterPublicKeyConfigured: false,
	};
}

function audioElementSupported(): boolean {
	return (
		typeof window !== "undefined" &&
		"HTMLAudioElement" in globalThis
	);
}

export function App(): ReactElement {
	const [sidecarClient, setSidecarClient] = useState<SidecarClient | null>(null);
	const [splashActive, setSplashActive] = useState<boolean>(SHOW_SPLASH);

	const currentTrack = usePlaybackStore((s) => s.currentTrack);
	const queue = usePlaybackStore((s) => s.queue);
	const isPlaying = usePlaybackStore((s) => s.isPlaying);
	const positionMs = usePlaybackStore((s) => s.positionMs);
	const durationMs = usePlaybackStore((s) => s.durationMs);
	const volume = usePlaybackStore((s) => s.volume);
	const muted = usePlaybackStore((s) => s.muted);
	const setMatrix = useProviderStore((s) => s.setMatrix);
	const consoleVisible = useUiStore((s) => s.consoleVisible);
	const setConsole = useUiStore((s) => s.setConsole);
	const miniQueueOpen = useUiStore((s) => s.miniQueueOpen);
	const setMiniQueue = useUiStore((s) => s.setMiniQueue);
	const toggleMiniQueue = useUiStore((s) => s.toggleMiniQueue);
	const toast = useUiStore((s) => s.toast);
	const showToast = useUiStore((s) => s.showToast);
	const clearToast = useUiStore((s) => s.clearToast);

	const lyricsPayload = useLyricsStore((s) => s.payload);
	const setLyricsPayload = useLyricsStore((s) => s.setPayload);
	const setLyricsLoading = useLyricsStore((s) => s.setLoading);
	const setLyricsError = useLyricsStore((s) => s.setError);
	const setLyricsIndex = useLyricsStore((s) => s.setCurrentIndex);
	const lyricsReset = useLyricsStore((s) => s.reset);

	const togglePlay = usePlaybackStore((s) => s.togglePlay);
	const setPositionMs = usePlaybackStore((s) => s.setPosition);
	const setDurationMs = usePlaybackStore((s) => s.setDuration);
	const setVolume = usePlaybackStore((s) => s.setVolume);
	const toggleMute = usePlaybackStore((s) => s.toggleMute);
	const setPlaybackMode = usePlaybackStore((s) => s.setMode);
	const playbackMode = usePlaybackStore((s) => s.mode);
	const nextTrack = usePlaybackStore((s) => s.next);
	const previousTrack = usePlaybackStore((s) => s.previous);
	const playQueueAt = usePlaybackStore((s) => s.playAt);
	const removeQueueAt = usePlaybackStore((s) => s.removeAt);
	const insertQueueNext = usePlaybackStore((s) => s.insertNext);
	const setSearchKeyword = useSearchStore((s) => s.setKeyword);
	const setSearchError = useSearchStore((s) => s.setError);

	const cancelledRef = useRef(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const controllerRef = useRef<PlayerController | null>(null);
	const lastLoadedKeyRef = useRef<string>("");

	const positionRef = useRef(positionMs);
	positionRef.current = positionMs;
	const lyricsPayloadRef = useRef(lyricsPayload);
	lyricsPayloadRef.current = lyricsPayload;

	const initSidecar = useCallback((cfg: RuntimeConfig) => {
		const client = new SidecarClient(cfg.sidecarBaseUrl);
		setSidecarClient(client);
		return client;
	}, []);

	const emptyHomeActive = !splashActive && !currentTrack && queue.length === 0 && !isPlaying;

	const revealConsole = useCallback(() => {
		setConsole(true);
	}, [setConsole]);

	const focusSearch = useCallback(() => {
		if (typeof document === "undefined") return;
		const input = document.getElementById("search-input");
		if (input instanceof HTMLInputElement) input.focus();
	}, []);

	const searchQuery = useCallback((query: string) => {
		setSearchKeyword(query);
		focusSearch();
	}, [focusSearch, setSearchKeyword]);

	const showUnavailable = useCallback((message: string) => {
		setSearchError(message);
		showToast(message);
		focusSearch();
	}, [focusSearch, setSearchError, showToast]);

	const showNotice = useCallback((message: string) => {
		showToast(message);
	}, [showToast]);

	const goHome = useCallback(() => {
		setConsole(false);
		setMiniQueue(false);
		focusSearch();
	}, [focusSearch, setConsole, setMiniQueue]);

	const togglePlayback = useCallback(() => {
		if (!usePlaybackStore.getState().currentTrack) {
			showToast("先搜索或打开歌单选择一首歌");
			return;
		}
		const controller = controllerRef.current;
		if (!controller) {
			togglePlay();
			return;
		}
		if (usePlaybackStore.getState().isPlaying) controller.pause();
		else void controller.play();
	}, [showToast, togglePlay]);

	const playMiniQueueIndex = useCallback((index: number) => {
		playQueueAt(index);
		setMiniQueue(false);
	}, [playQueueAt, setMiniQueue]);

	const insertMiniQueueNext = useCallback((index: number) => {
		const track = usePlaybackStore.getState().queue[index];
		if (!track) return;
		insertQueueNext(track);
		showToast(`已设为下一首: ${track.title}`);
	}, [insertQueueNext, showToast]);

	const seekPlayback = useCallback((position: number) => {
		controllerRef.current?.seek(position);
		setPositionMs(position);
	}, [setPositionMs]);

	useEffect(() => {
		if (typeof document === "undefined") return;
		document.body.classList.toggle("splash-active", splashActive);
		document.body.classList.toggle("empty-home-active", emptyHomeActive);
		document.body.classList.toggle("controls-visible", consoleVisible);
		return () => {
			document.body.classList.remove("splash-active", "empty-home-active", "controls-visible");
		};
	}, [consoleVisible, emptyHomeActive, splashActive]);

	useEffect(() => {
		if (!toast) return;
		const timer = setTimeout(() => clearToast(), 2600);
		return () => clearTimeout(timer);
	}, [clearToast, toast]);

	useEffect(() => {
		if (!miniQueueOpen || typeof document === "undefined") return;
		const closeOnPointerDown = (event: PointerEvent) => {
			const target = event.target;
			if (target instanceof Element && target.closest("#bottom-bar")) return;
			setMiniQueue(false);
		};
		document.addEventListener("pointerdown", closeOnPointerDown);
		return () => document.removeEventListener("pointerdown", closeOnPointerDown);
	}, [miniQueueOpen, setMiniQueue]);

	useEffect(() => {
		controllerRef.current?.setVolume(muted ? 0 : volume);
	}, [muted, volume]);

	useEffect(() => {
		cancelledRef.current = false;
		let timer: ReturnType<typeof setTimeout> | null = null;

		async function boot(): Promise<void> {
			let cfg: RuntimeConfig;
			try {
				cfg = await getRuntimeConfig();
			} catch {
				cfg = placeholderRuntimeConfig();
			}
			if (cancelledRef.current) return;

			if (!cfg.sidecarBaseUrl) {
				console.warn("sidecar base url not configured", {
					code: "NO_RUNTIME",
					message: "sidecar base url not configured",
				});
				return;
			}

			const client = initSidecar(cfg);
			let attempts = 0;

			async function poll(): Promise<void> {
				try {
					await client.health();
					if (cancelledRef.current) return;
					try {
						const caps = await client.capabilities();
						if (!cancelledRef.current) setMatrix(caps);
					} catch {
						// 能力矩阵仅用于运行期同步，失败不阻断视觉宿主。
					}
				} catch (e) {
					if (cancelledRef.current) return;
					attempts += 1;
					if (e instanceof SidecarClientError) {
						console.warn("sidecar health failed", { code: e.code, message: e.message });
					} else {
						console.warn("sidecar health failed", { code: "UNKNOWN", message: "unknown error" });
					}
					if (attempts < 5) {
						timer = setTimeout(() => {
							void poll();
						}, 800);
					}
				}
			}

			void poll();
		}

		void boot();
		return () => {
			cancelledRef.current = true;
			if (timer) clearTimeout(timer);
		};
	}, [initSidecar, setMatrix]);

	useEffect(() => {
		if (!audioElementSupported()) return;
		if (controllerRef.current) return;
		const audio = new Audio();
		audio.preload = "metadata";
		audioRef.current = audio;
		const controller = new PlayerController(audio);
		const playback = usePlaybackStore.getState();
		controller.setVolume(playback.muted ? 0 : playback.volume);
		controllerRef.current = controller;

		let lastDuration: number | null = null;

		controller.on("timeupdate", (payload) => {
			setPositionMs(payload.positionMs);
			if (payload.durationMs !== null && payload.durationMs !== lastDuration) {
				lastDuration = payload.durationMs;
				setDurationMs(payload.durationMs);
			}
			const idx = selectCurrentIndex(payload.positionMs, lyricsPayloadRef.current);
			setLyricsIndex(idx);
		});
		controller.on("durationchange", (payload) => {
			if (payload.durationMs !== null) {
				setDurationMs(payload.durationMs);
			}
		});
		controller.on("play", () => {
			if (!usePlaybackStore.getState().isPlaying) togglePlay();
		});
		controller.on("pause", () => {
			if (usePlaybackStore.getState().isPlaying) togglePlay();
		});
		controller.on("ended", () => {
			setPositionMs(0);
			usePlaybackStore.getState().ended();
			if (usePlaybackStore.getState().mode === "single" && controllerRef.current) {
				controllerRef.current.seek(0);
				void controllerRef.current.play();
			}
		});
		controller.on("error", (payload) => {
			console.warn("audio playback failed", { code: `AUDIO_${payload.code}`, message: payload.message });
		});
		return () => {
			controllerRef.current = null;
			audioRef.current = null;
		};
	}, [setDurationMs, setLyricsIndex, setPositionMs, togglePlay]);

	useEffect(() => {
		const controller = controllerRef.current;
		const client = sidecarClient;
		if (!controller || !client) return;
		if (!currentTrack) {
			lastLoadedKeyRef.current = "";
			controller.pause();
			lyricsReset();
			return;
		}
		const key = `${currentTrack.provider}:${currentTrack.id}`;
		if (key === lastLoadedKeyRef.current) return;
		lastLoadedKeyRef.current = key;

		void (async () => {
			try {
				const result = await client.resolveSongUrl(currentTrack);
				const audioUrl = result.proxied ? result.url : client.audioProxyUrl(result.url);
				controller.load(audioUrl);
				await controller.play();
			} catch (e) {
				const code = e instanceof SidecarClientError ? e.code : "AUDIO_UNKNOWN";
				const message = e instanceof Error ? e.message : "playback error";
				console.warn("playback load failed", { code, message });
			}
			try {
				setLyricsLoading(true);
				const lyric = await client.lyric(currentTrack);
				setLyricsPayload(lyric);
			} catch (e) {
				const message = e instanceof Error ? e.message : "lyrics failed";
				setLyricsError(message);
			}
		})();
	}, [currentTrack, sidecarClient, setLyricsError, setLyricsLoading, setLyricsPayload, lyricsReset]);

	return (
		<>
			{SHOW_SPLASH && (
				<SplashHost
					onDismissed={() => setSplashActive(false)}
				/>
			)}
			<VisualEngineHost
				audioElementRef={audioRef}
				controllerRef={controllerRef}
				lyricsPayload={lyricsPayload}
				positionMs={positionMs}
				isPlaying={isPlaying}
				queue={queue}
				currentTrack={currentTrack}
				coverResolution={1.55}
				splashActive={splashActive}
				onShelfPlayQueueIndex={(index) => usePlaybackStore.getState().playAt(index)}
				onShelfDetailRowClick={playShelfDetailRow}
				onShelfOpenDetailContent={(payload, contentList) => {
					const loader = createShelfDetailContentLoader({
						client: sidecarClient,
						getContentList: () => contentList,
					});
					void loader(payload);
				}}
			/>
			<EmptyHomeHost
				onSearchFocus={focusSearch}
				onOpenLibrary={() => showUnavailable("歌单库需要登录后同步，先试试搜索歌单名")}
				onOpenConsole={revealConsole}
				onSearchQuery={searchQuery}
				onUpload={() => showUnavailable("本地导入会在 Tauri 文件对话框中打开")}
				onGuide={() => showUnavailable("视觉引导入口正在迁移，当前可先使用搜索和播放")}
			/>
			<SearchShell client={sidecarClient} onFocus={focusSearch} onUpload={() => showUnavailable("本地导入会在 Tauri 文件对话框中打开")} />
			<TopRightControls
				onHome={goHome}
				onLogin={() => showUnavailable("登录窗口正在迁移，Netease/QQ 凭证仍需手动注入验证")}
				onHideCapsule={() => showUnavailable("账号胶囊自动隐藏已记录，登录完成后生效")}
			/>
			<BottomControlsHost
				visible={consoleVisible}
				onReveal={revealConsole}
				onTogglePlay={togglePlayback}
				onPrevious={previousTrack}
				onNext={nextTrack}
				onModeChange={setPlaybackMode}
				onQueue={toggleMiniQueue}
				onLyrics={() => showNotice(lyricsPayload ? "歌词已载入舞台层" : "播放歌曲后会自动加载歌词")}
				onClose={() => {
					setConsole(false);
					setMiniQueue(false);
				}}
				onNotice={showNotice}
				onSeek={seekPlayback}
				onVolumeChange={setVolume}
				onToggleMute={toggleMute}
				onPlayQueueIndex={playMiniQueueIndex}
				onRemoveQueueIndex={removeQueueAt}
				onInsertQueueNext={insertMiniQueueNext}
				mode={playbackMode}
				isPlaying={isPlaying}
				currentTitle={currentTrack?.title}
				currentArtist={currentTrack?.artists.join(" / ")}
				currentCoverUrl={currentTrack?.coverUrl}
				queue={queue}
				currentTrack={currentTrack}
				miniQueueOpen={miniQueueOpen}
				positionMs={positionMs}
				durationMs={durationMs}
				volume={volume}
				muted={muted}
			/>
			<div id="toast" className={toast ? "show" : ""} role="status" aria-live="polite">{toast ?? ""}</div>
		</>
	);
}
