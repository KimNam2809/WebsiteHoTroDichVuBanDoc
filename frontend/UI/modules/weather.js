export async function initWeatherWidget(){
	const widget = document.querySelector('[data-weather-widget]');
	if (!widget) return;
	try {
		const lat = 16.0471, lon = 108.2062; // Da Nang
		// Fetch current, hourly, and daily data in one call
		const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`+
			`&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,visibility`+
			`&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,uv_index,is_day,visibility,pressure_msl,wind_speed_10m,wind_gusts_10m,wind_direction_10m`+
			`&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,daylight_duration,uv_index_max`+
			`&timezone=Asia%2FHo_Chi_Minh`;
		const [weatherRes, airRes] = await Promise.all([
			fetch(url),
			fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=us_aqi`)
		]);
		if (!weatherRes.ok) throw new Error('Weather fetch failed');
		const data = await weatherRes.json();
		const air = airRes.ok ? await airRes.json() : null;

		const cur = data.current;
		const mapping = weatherCodeMapping(cur.weather_code);

		// Units state (C/F)
		let useF = false;
		const btnC = widget.querySelector('[data-unit="c"]');
		const btnF = widget.querySelector('[data-unit="f"]');
		const updateUnitsButtons = () => {
			btnC.className = `px-2 py-1 text-xs rounded ${useF? 'bg-gray-100 text-gray-600':'bg-blue-50 text-blue-700 font-medium'}`;
			btnF.className = `px-2 py-1 text-xs rounded ${useF? 'bg-blue-50 text-blue-700 font-medium':'bg-gray-100 text-gray-600'}`;
		};

		function cToF(c){ return Math.round((c * 9/5) + 32); }
		function fmtTemp(c){ return useF ? `${cToF(c)}°` : `${Math.round(c)}°`; }

		// Header info
		const updated = new Date();
		widget.querySelector('[data-updated]').textContent = `Cập nhật ${updated.getHours()}:${String(updated.getMinutes()).padStart(2,'0')}`;

		// Current
		widget.querySelector('[data-temp]').textContent = fmtTemp(cur.temperature_2m);
		widget.querySelector('[data-cond]').textContent = mapping.desc;
		widget.querySelector('[data-icon]').textContent = mapping.emoji;

		// Daily highs/lows
		const hi = data.daily?.temperature_2m_max?.[0];
		const lo = data.daily?.temperature_2m_min?.[0];
		if (hi!=null) widget.querySelector('[data-high]').textContent = useF ? cToF(hi) : Math.round(hi);
		if (lo!=null) widget.querySelector('[data-low]').textContent = useF ? cToF(lo) : Math.round(lo);

		// Forecast responsive (min 1, max depends on container width and available data)
		const forecastEl = widget.querySelector('[data-forecast]');
		const renderForecast = (maxItems)=>{
			forecastEl.innerHTML = '';
			const totalDays = (data.daily?.time||[]).length;
			const days = Math.max(1, Math.min(maxItems, totalDays));
			for(let i=0;i<days;i++){
				const code = data.daily.weather_code[i];
				const m = weatherCodeMapping(code);
				const dayLabel = new Date(data.daily.time[i]).toLocaleDateString('vi-VN',{ weekday:'short' });
				const hiD = data.daily.temperature_2m_max[i];
				const loD = data.daily.temperature_2m_min[i];
				const item = document.createElement('div');
				item.className = 'flex-shrink-0 w-20 text-center text-sm text-gray-700';
				item.innerHTML = `
					<div class="font-medium">${dayLabel}</div>
					<div class="text-xl">${m.emoji}</div>
					<div class="text-xs">${useF?cToF(hiD):Math.round(hiD)}° / ${useF?cToF(loD):Math.round(loD)}°</div>
				`;
				forecastEl.appendChild(item);
			}
		};
		const computeMaxItems = ()=>{
			const w = forecastEl.clientWidth || 200;
			// Estimate columns based on ~92px per item including ~12px gap (w-20 ~80px)
			const approx = Math.floor(w / 92);
			return Math.max(1, approx);
		};
		renderForecast(computeMaxItems());

		// Re-render on resize (debounced)
		let resizeTimer;
		window.addEventListener('resize', ()=>{
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(()=>{
				renderForecast(computeMaxItems());
			}, 150);
		});

		// Tiles
		const visKm = (cur.visibility ?? data.hourly?.visibility?.[0] ?? null);
		if (visKm!=null) widget.querySelector('[data-visibility]').textContent = `${Math.round(visKm/1000)} km`;
	widget.querySelector('[data-visibility-text]').textContent = visKm>=10000 ? 'Rất tốt' : visKm>=7000 ? 'Tốt' : 'Trung bình';

		const pressure = cur.pressure_msl ?? data.hourly?.pressure_msl?.[0];
		if (pressure!=null) widget.querySelector('[data-pressure]').textContent = Math.round(pressure);
	// Mô tả áp suất
	const desc = pressure>=1020? 'Cao (khô ráo)' : pressure<=1005? 'Thấp (dễ mưa)' : 'Trung bình';
	widget.querySelector('[data-pressure-trend]').textContent = desc;

		const wind = cur.wind_speed_10m ?? data.hourly?.wind_speed_10m?.[0];
		const gust = data.hourly?.wind_gusts_10m?.[0] ?? wind;
		const dir = cur.wind_direction_10m ?? data.hourly?.wind_direction_10m?.[0];
		if (wind!=null) widget.querySelector('[data-wind-speed]').textContent = Math.round(wind);
		if (gust!=null) widget.querySelector('[data-wind-gust]').textContent = Math.round(gust);
		if (dir!=null) widget.querySelector('[data-wind-dir]').textContent = Math.round(dir);
	// Bỏ liên kết bản đồ

		const humid = cur.relative_humidity_2m ?? data.hourly?.relative_humidity_2m?.[0];
		if (humid!=null) widget.querySelector('[data-humidity]').textContent = Math.round(humid);
		const dew = data.hourly?.dew_point_2m?.[0];
		if (dew!=null) widget.querySelector('[data-dewpoint]').textContent = useF? cToF(dew) : Math.round(dew);

		const uv = data.daily?.uv_index_max?.[0] ?? data.hourly?.uv_index?.[0];
		if (uv!=null) {
			widget.querySelector('[data-uv]').textContent = Math.round(uv);
			widget.querySelector('[data-uv-text]').textContent = uv>=11? 'Cực cao' : uv>=8? 'Rất cao' : uv>=6? 'Cao' : uv>=3? 'Trung bình' : 'Thấp';
			widget.querySelector('[data-uv-text]').className = `text-xs ${uv>=8? 'text-red-600': uv>=6? 'text-orange-600':'text-green-700'}`;
		}

		const sunrise = data.daily?.sunrise?.[0];
		const sunset = data.daily?.sunset?.[0];
		const daylen = data.daily?.daylight_duration?.[0];
		const sunriseEl = widget.querySelector('[data-sunrise]');
		const sunsetEl = widget.querySelector('[data-sunset]');
		if (sunrise && sunriseEl) sunriseEl.textContent = new Date(sunrise).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
		if (sunset && sunsetEl) sunsetEl.textContent = new Date(sunset).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
		if (daylen!=null){ const h=Math.floor(daylen/3600), m=Math.round((daylen%3600)/60); widget.querySelector('[data-daylength]').textContent = `${h}h ${m}m`; }

		// AQI
		if (air?.hourly?.us_aqi?.length){
			const aqi = air.hourly.us_aqi[0];
			widget.querySelector('[data-aqi]').textContent = aqi;
			widget.querySelector('[data-aqi-text]').textContent = aqi<=50? 'Good': aqi<=100? 'Moderate': aqi<=150? 'Unhealthy (SG)': aqi<=200? 'Unhealthy': aqi<=300? 'Very Unhealthy': 'Hazardous';
		}

		// Unit toggle handlers
		updateUnitsButtons();
		btnC.addEventListener('click', ()=>{ useF=false; rerenderTemps(); updateUnitsButtons(); });
		btnF.addEventListener('click', ()=>{ useF=true; rerenderTemps(); updateUnitsButtons(); });

		function rerenderTemps(){
			widget.querySelector('[data-temp]').textContent = fmtTemp(cur.temperature_2m);
			if (hi!=null) widget.querySelector('[data-high]').textContent = useF? cToF(hi): Math.round(hi);
			if (lo!=null) widget.querySelector('[data-low]').textContent = useF? cToF(lo): Math.round(lo);
			const dew = data.hourly?.dew_point_2m?.[0];
			if (dew!=null) widget.querySelector('[data-dewpoint]').textContent = useF? cToF(dew): Math.round(dew);
			// rebuild forecast temps
			const totalDays = (data.daily?.time||[]).length;
			const maxItems = Math.min(totalDays, computeMaxItems());
			renderForecast(maxItems);
		}
	} catch (e) {
		if (widget) widget.innerHTML = '<div class="p-4 text-sm text-red-600">Không tải được thời tiết.</div>';
	}
}

function weatherCodeMapping(code){
	const map={
		0:{desc:'Trời quang',emoji:'☀️'}, 1:{desc:'Ít mây',emoji:'🌤️'}, 2:{desc:'Nhiều mây',emoji:'⛅'}, 3:{desc:'U ám',emoji:'☁️'},
		45:{desc:'Sương mù',emoji:'🌫️'}, 48:{desc:'Sương mù băng',emoji:'🌫️'},
		51:{desc:'Mưa phùn nhẹ',emoji:'🌦️'}, 61:{desc:'Mưa nhẹ',emoji:'🌧️'}, 63:{desc:'Mưa vừa',emoji:'🌧️'}, 65:{desc:'Mưa to',emoji:'⛈️'},
		71:{desc:'Tuyết rơi',emoji:'❄️'}, 95:{desc:'Dông',emoji:'⛈️'}
	};
	return map[code]||{desc:'Thời tiết',emoji:'🌤️'};
}
