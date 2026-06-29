import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { EmptyHomeHost, buildHomeWaveFrame } from "./EmptyHomeHost";

test("EmptyHomeHost renders the baseline empty-home music landing structure", () => {
	const html = renderToStaticMarkup(React.createElement(EmptyHomeHost));
	expect(html).toContain('id="empty-home"');
	expect(html).toContain('id="home-weather-kicker"');
	expect(html).toContain("Mineradio · Your Library");
	expect(html).toContain('id="home-weather-title"');
	expect(html).toContain("我的音乐库");
	expect(html).toContain('id="home-subtitle"');
	expect(html).toContain("登录后会把你的歌单、常听歌手和最近播放放在这里；也可以直接搜索或导入本地音乐。");
	expect(html).toContain('id="home-weather-meta"');
	expect(html).toContain('class="home-quick-row"');
	expect(html).toContain('class="home-visual generated"');
	expect(html).toContain('id="home-wave-track"');
	expect(html).toContain('id="home-mosaic"');
	expect(html).toContain('class="home-mosaic-cell"');
	expect(html).toContain("展开播放器控制台");
	expect(html).toContain('class="home-grid"');
	expect(html).toContain("我的歌单");
	expect(html).toContain("每日推荐");
	expect(html).toContain("推荐歌曲");
	expect(html).toContain('id="home-tile-row"');
	expect(html).not.toContain("🚧此处施工，敬请期待🚧");
	expect(html).not.toContain('class="home-tile-action"');
});

test("EmptyHomeHost switches the baseline hero subtitle for logged-in home", () => {
	const html = renderToStaticMarkup(React.createElement(EmptyHomeHost, {
		discover: {
			loggedIn: true,
			user: { provider: "netease", userId: "42", nickname: "tester", avatarUrl: "" },
			mode: "member",
			dailySongs: [],
			playlists: [],
			podcasts: [],
			updatedAt: 1782656256000,
		},
	}));

	expect(html).toContain("从你的歌单、最近播放和常听歌手开始，天气电台放在需要氛围的时候再开。");
	expect(html).not.toContain("登录后会把你的歌单、常听歌手和最近播放放在这里");
});

test("EmptyHomeHost renders baseline weather meta pills", () => {
	const html = renderToStaticMarkup(React.createElement(EmptyHomeHost, {
		weatherRadio: {
			ok: true,
			weather: {
				provider: "open-meteo",
				location: { name: "上海", country: "中国", admin1: "", latitude: 31.23, longitude: 121.47, timezone: "Asia/Shanghai", fallback: false },
				label: "雨",
				weatherCode: 61,
				temperature: 22.4,
				apparentTemperature: 21.6,
				humidity: 88,
				precipitation: 1,
				cloudCover: 90,
				windSpeed: 6,
				windGusts: 10,
				isDay: 1,
				time: "",
				updatedAt: 1,
				error: "",
				mood: { key: "rain", title: "雨天电台", tagline: "留一点潮湿的空间给旋律", energy: 0.38, warmth: 0.42, focus: 0.64, melancholy: 0.66, keywords: ["雨天 R&B"] },
			},
			radio: {
				title: "雨天电台",
				subtitle: "留一点潮湿的空间给旋律",
				seedQueries: ["雨天 R&B"],
				updatedAt: 1,
				songs: [],
			},
		},
	}));

	expect(html).toContain('<span class="home-weather-pill">上海</span>');
	expect(html).toContain('<span class="home-weather-pill">雨 · 22°</span>');
	expect(html).toContain('<span class="home-weather-pill">体感 22°</span>');
	expect(html).toContain('<span class="home-weather-pill">湿度 88%</span>');
});

test("EmptyHomeHost marks baseline Home loading placeholders with skeleton shimmer", () => {
	const html = renderToStaticMarkup(React.createElement(EmptyHomeHost, { loading: true }));

	expect(html).toContain("home-mosaic-cell home-skeleton");
	expect(html).toContain("home-tile home-skeleton");
});

test("buildHomeWaveFrame follows baseline 24 bar smoothed audio fallback", () => {
	let frame = buildHomeWaveFrame({ timeMs: 0, isPlaying: false });
	for (let tick = 1; tick <= 8; tick += 1) {
		frame = buildHomeWaveFrame({
			timeMs: tick * 80,
			isPlaying: true,
			positionMs: 4800 + tick * 80,
			durationMs: 180000,
		}, frame.smooth);
	}
	const heights = frame.bars.map((bar) => bar.height);

	expect(frame.bars.length).toBe(24);
	expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(0.1);
	expect(frame.bars.every((bar) => bar.height >= 4 && bar.opacity >= 0.32 && bar.opacity <= 1)).toBe(true);
});

test("EmptyHomeHost routes baseline hero quick chips", async () => {
	await import("../../../../packages/visual-engine/src/runtime/happy-dom-preload");
	const calls: string[] = [];
	const host = document.createElement("div");
	document.body.appendChild(host);
	const root = createRoot(host);

	flushSync(() => root.render(<EmptyHomeHost
		onSearchFocus={() => calls.push("search")}
		onOpenLibrary={() => calls.push("library")}
		onUpload={() => calls.push("upload")}
		onOpenPodcastSearch={() => calls.push("podcast")}
		onOpenConsole={() => calls.push("console")}
	/>));

	(host.querySelector('[data-home-chip="search"]') as HTMLButtonElement).click();
	(host.querySelector('[data-home-chip="library"]') as HTMLButtonElement).click();
	(host.querySelector('[data-home-chip="local"]') as HTMLButtonElement).click();
	(host.querySelector('[data-home-chip="podcast"]') as HTMLButtonElement).click();
	(host.querySelector('[data-home-chip="console"]') as HTMLButtonElement).click();

	expect(calls).toEqual(["search", "library", "upload", "podcast", "console"]);
	root.unmount();
	host.remove();
});

test("EmptyHomeHost renders baseline recent and profile summary into cards and rail", () => {
	const html = renderToStaticMarkup(React.createElement(EmptyHomeHost, {
		discover: {
			loggedIn: true,
			user: { provider: "netease", userId: "42", nickname: "tester", avatarUrl: "" },
			mode: "member",
			dailySongs: [],
			playlists: [],
			podcasts: [],
			updatedAt: 1782656256000,
		},
		listenSummary: {
			recent: {
				plays: 2,
				track: { provider: "netease", id: "recent-1", sourceId: "recent-1", title: "最近一首", artists: ["Alice"], album: "", coverUrl: "https://img.example/recent.jpg", qualityHints: [], playableState: "playable" },
			},
			topArtist: { name: "Alice", plays: 3, coverUrl: "https://img.example/artist.jpg" },
			topSong: {
				plays: 2,
				track: { provider: "netease", id: "top-1", sourceId: "top-1", title: "最常听", artists: ["Alice"], album: "", coverUrl: "https://img.example/top.jpg", qualityHints: [], playableState: "playable" },
			},
			totalPlays: 5,
		},
	}));

	expect(html).toContain('id="home-continue-title">最近一首');
	expect(html).toContain('id="home-profile-title">Alice');
	expect(html).toContain("常听歌手 · 3 次");
	expect(html).toContain("最近一首");
	expect(html).toContain("https://img.example/recent.jpg");
});

test("EmptyHomeHost routes baseline recent and profile cards", async () => {
	await import("../../../../packages/visual-engine/src/runtime/happy-dom-preload");
	const calls: string[] = [];
	const host = document.createElement("div");
	document.body.appendChild(host);
	const root = createRoot(host);

	flushSync(() => root.render(<EmptyHomeHost
		onPlayRecent={() => calls.push("recent")}
		onOpenInsight={() => calls.push("profile")}
		listenSummary={{
			recent: {
				plays: 1,
				track: { provider: "netease", id: "recent-1", sourceId: "recent-1", title: "最近一首", artists: ["Alice"], album: "", coverUrl: "", qualityHints: [], playableState: "playable" },
			},
			topArtist: { name: "Alice", plays: 1 },
			totalPlays: 1,
		}}
	/>));
	(host.querySelector('[data-home-card="continue"]') as HTMLButtonElement).click();
	(host.querySelector('[data-home-card="profile"]') as HTMLButtonElement).click();

	expect(calls).toEqual(["recent", "profile"]);
	root.unmount();
	host.remove();
});

test("EmptyHomeHost renders baseline logged-out starter tiles", () => {
	const html = renderToStaticMarkup(React.createElement(EmptyHomeHost, {
		discover: {
			loggedIn: false,
			user: null,
			dailySongs: [],
			playlists: [],
			podcasts: [],
			mode: "starter",
			updatedAt: 1782656256000,
		},
	}));

	expect(html).toContain("登录同步歌单");
	expect(html).toContain("搜索一首歌");
	expect(html).toContain("导入本地音乐");
	expect(html).toContain("搜索播客");
	expect(html).toContain("看看视觉舞台");
});

test("EmptyHomeHost prefers baseline weather radio songs in the rail when discover is logged out", () => {
	const html = renderToStaticMarkup(React.createElement(EmptyHomeHost, {
		discover: {
			loggedIn: false,
			user: null,
			dailySongs: [],
			playlists: [],
			podcasts: [],
			mode: "starter",
			updatedAt: 1782656256000,
		},
		weatherRadio: {
			ok: true,
			weather: {
				provider: "open-meteo",
				location: { name: "上海", country: "中国", admin1: "", latitude: 31.23, longitude: 121.47, timezone: "Asia/Shanghai", fallback: false },
				label: "雨",
				weatherCode: 61,
				temperature: 22,
				apparentTemperature: 21,
				humidity: 88,
				precipitation: 1,
				cloudCover: 90,
				windSpeed: 6,
				windGusts: 10,
				isDay: 1,
				time: "",
				updatedAt: 1,
				error: "",
				mood: { key: "rain", title: "雨天电台", tagline: "留一点潮湿的空间给旋律", energy: 0.38, warmth: 0.42, focus: 0.64, melancholy: 0.66, keywords: ["雨天 R&B"] },
			},
			radio: {
				title: "雨天电台",
				subtitle: "留一点潮湿的空间给旋律",
				seedQueries: ["雨天 R&B"],
				updatedAt: 1,
				songs: [
					{ provider: "netease", id: "weather-1", sourceId: "weather-1", title: "Rain One", artists: ["Alice"], album: "", coverUrl: "https://img.example/rain.jpg", qualityHints: [], playableState: "playable" },
				],
			},
		},
	}));

	expect(html).toContain("Rain One");
	expect(html).toContain("Alice");
	expect(html).toContain("刚刚更新 · 点击即可播放");
	expect(html).not.toContain("登录同步歌单");
});

test("EmptyHomeHost renders discover songs, playlists, and podcasts into baseline cards and rail", () => {
	const html = renderToStaticMarkup(React.createElement(EmptyHomeHost, {
		discover: {
			loggedIn: true,
			user: { provider: "netease", userId: "42", nickname: "tester", avatarUrl: "" },
			mode: "member",
			dailySongs: [
				{ provider: "netease", id: "1", sourceId: "1", title: "第一首", artists: ["A"], album: "", coverUrl: "https://img.example/a.jpg", qualityHints: [], playableState: "playable" },
				{ provider: "netease", id: "2", sourceId: "2", title: "第二首", artists: ["B"], album: "", coverUrl: "https://img.example/b.jpg", qualityHints: [], playableState: "playable" },
				{ provider: "netease", id: "3", sourceId: "3", title: "第三首", artists: ["C"], album: "", coverUrl: "", qualityHints: [], playableState: "playable" },
			],
			playlists: [{ provider: "netease", id: "p1", name: "我的歌单", coverUrl: "https://img.example/p.jpg", trackCount: 8, trackIds: [], subscribed: false }],
			podcasts: [{ id: "r1", rid: "r1", name: "热门播客", coverUrl: "", description: "", djName: "DJ", category: "音乐", programCount: 5, subCount: 0 }],
			updatedAt: 1782656256000,
		},
	}));

	expect(html).toContain("第一首");
	expect(html).toContain("第二首");
	expect(html).toContain("第三首");
	expect(html).toContain("我的歌单");
	expect(html).toContain("热门播客");
	expect(html).toContain("刚刚更新 · 点击即可播放");
});

test("EmptyHomeHost marks real Home card covers with the baseline has-cover class", () => {
	const html = renderToStaticMarkup(React.createElement(EmptyHomeHost, {
		discover: {
			loggedIn: true,
			user: { provider: "netease", userId: "42", nickname: "tester", avatarUrl: "" },
			mode: "member",
			dailySongs: [
				{ provider: "netease", id: "1", sourceId: "1", title: "第一首", artists: ["A"], album: "", coverUrl: "https://img.example/a.jpg", qualityHints: [], playableState: "playable" },
				{ provider: "netease", id: "2", sourceId: "2", title: "第二首", artists: ["B"], album: "", coverUrl: "https://img.example/b.jpg", qualityHints: [], playableState: "playable" },
			],
			playlists: [{ provider: "netease", id: "p1", name: "我的歌单", coverUrl: "https://img.example/p.jpg", trackCount: 8, trackIds: [], subscribed: false }],
			podcasts: [],
			updatedAt: 1782656256000,
		},
	}));

	expect(html).toContain('id="home-daily-art"');
	expect(/class="home-card-art has-cover" id="home-daily-art" style="background-image:url\(&quot;https:\/\/img\.example\/a\.jpg&quot;\)"/.test(html)).toBe(true);
	expect(/class="home-card-art has-cover" id="home-private-art" style="background-image:url\(&quot;https:\/\/img\.example\/b\.jpg&quot;\)"/.test(html)).toBe(true);
	expect(/class="home-card-art has-cover" id="home-weather-art" style="background-image:url\(&quot;https:\/\/img\.example\/p\.jpg&quot;\)"/.test(html)).toBe(true);
});

test("Home CSS keeps baseline cover pseudo-elements without the migration-only bottom mask", async () => {
	const css = await fetch(new URL("../styles.css", import.meta.url)).then((response) => response.text());

	expect(css).toContain(".home-card-art::after");
	expect(css).toContain(".home-tile-cover:not(.has-cover)::before");
	expect(css).toContain(".home-tile-cover:not(.has-cover)::after");
	expect(css).not.toContain("body.empty-home-active::before");
});

test("EmptyHomeHost routes the private radio card to the baseline Home private callback", async () => {
	await import("../../../../packages/visual-engine/src/runtime/happy-dom-preload");
	const calls: string[] = [];
	const host = document.createElement("div");
	document.body.appendChild(host);
	const root = createRoot(host);

	flushSync(() => root.render(<EmptyHomeHost onPlayPrivate={() => calls.push("private")} />));
	(host.querySelector('[data-home-card="private"]') as HTMLButtonElement).click();

	expect(calls).toEqual(["private"]);
	root.unmount();
	host.remove();
});

test("EmptyHomeHost routes weather song tiles to the baseline weather callback", async () => {
	await import("../../../../packages/visual-engine/src/runtime/happy-dom-preload");
	const calls: number[] = [];
	const host = document.createElement("div");
	document.body.appendChild(host);
	const root = createRoot(host);

	flushSync(() => root.render(<EmptyHomeHost
		discover={{ loggedIn: false, user: null, dailySongs: [], playlists: [], podcasts: [], mode: "starter", updatedAt: 1 }}
		weatherRadio={{
			ok: true,
			weather: {
				provider: "open-meteo",
				location: { name: "上海", country: "中国", admin1: "", latitude: 31.23, longitude: 121.47, timezone: "Asia/Shanghai", fallback: false },
				label: "雨",
				weatherCode: 61,
				temperature: 22,
				apparentTemperature: 21,
				humidity: 88,
				precipitation: 1,
				cloudCover: 90,
				windSpeed: 6,
				windGusts: 10,
				isDay: 1,
				time: "",
				updatedAt: 1,
				error: "",
				mood: { key: "rain", title: "雨天电台", tagline: "留一点潮湿的空间给旋律", energy: 0.38, warmth: 0.42, focus: 0.64, melancholy: 0.66, keywords: ["雨天 R&B"] },
			},
			radio: {
				title: "雨天电台",
				subtitle: "留一点潮湿的空间给旋律",
				seedQueries: ["雨天 R&B"],
				updatedAt: 1,
				songs: [
					{ provider: "netease", id: "weather-1", sourceId: "weather-1", title: "Rain One", artists: ["Alice"], album: "", coverUrl: "", qualityHints: [], playableState: "playable" },
				],
			},
		}}
		onPlayWeatherSong={(index) => calls.push(index)}
	/>));
	(host.querySelector(".home-tile") as HTMLButtonElement).click();

	expect(calls).toEqual([0]);
	root.unmount();
	host.remove();
});
