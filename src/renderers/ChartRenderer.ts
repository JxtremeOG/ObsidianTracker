import type { ComputedTask, Priority } from '../types';
import { todayString } from '../model/PriorityCalculator';

const SVG_NS = 'http://www.w3.org/2000/svg';

const PRIORITY_COLORS: Record<Priority, string> = {
	'Overdue': 'var(--text-error)',
	'High Priority': 'var(--text-warning)',
	'Flexible': 'var(--text-accent)',
	'Completed': 'var(--text-faint)',
};

const NON_COMPLETED_PRIORITIES: Priority[] = ['Overdue', 'High Priority', 'Flexible'];

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string> = {}): SVGElementTagNameMap[K] {
	const el = document.createElementNS(SVG_NS, tag);
	for (const [k, v] of Object.entries(attrs)) {
		el.setAttribute(k, v);
	}
	return el;
}

function getNext7Days(today: string): Array<{ dateStr: string; label: string }> {
	const base = new Date(today + 'T00:00:00');
	const days: Array<{ dateStr: string; label: string }> = [];
	const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	for (let i = 0; i < 7; i++) {
		const d = new Date(base);
		d.setDate(base.getDate() + i);
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		days.push({
			dateStr: `${year}-${month}-${day}`,
			label: dayNames[d.getDay()]!,
		});
	}

	return days;
}

export function renderBarChart(tasks: ComputedTask[]): SVGSVGElement {
	const today = todayString();
	const days = getNext7Days(today);

	const counts = days.map(d =>
		tasks.filter(t => t.todoDate === d.dateStr).length,
	);

	const maxCount = Math.max(...counts, 1);

	const svg = svgEl('svg', { viewBox: '0 0 220 170' });

	const chartLeft = 25;
	const chartRight = 210;
	const chartTop = 15;
	const chartBottom = 140;
	const chartHeight = chartBottom - chartTop;
	const chartWidth = chartRight - chartLeft;

	const barGap = 4;
	const barWidth = (chartWidth / 7) - barGap;

	// Title
	const title = svgEl('text', {
		x: String(chartLeft + chartWidth / 2),
		y: '10',
		'text-anchor': 'middle',
		'font-size': '10',
		fill: 'var(--text-muted)',
		'font-weight': '600',
	});
	title.textContent = 'Tasks This Week';
	svg.appendChild(title);

	// Y-axis gridlines
	const gridLines = Math.min(maxCount, 4);
	for (let i = 0; i <= gridLines; i++) {
		const y = chartBottom - (i / gridLines) * chartHeight;
		svg.appendChild(svgEl('line', {
			x1: String(chartLeft),
			y1: String(y),
			x2: String(chartRight),
			y2: String(y),
			stroke: 'var(--background-modifier-border)',
			'stroke-width': '0.5',
		}));
		const label = svgEl('text', {
			x: String(chartLeft - 4),
			y: String(y + 3),
			'text-anchor': 'end',
			'font-size': '8',
			fill: 'var(--text-faint)',
		});
		label.textContent = String(Math.round((i / gridLines) * maxCount));
		svg.appendChild(label);
	}

	// Bars and labels
	for (let i = 0; i < 7; i++) {
		const x = chartLeft + i * (barWidth + barGap) + barGap / 2;
		const count = counts[i]!;
		const barHeight = (count / maxCount) * chartHeight;

		if (count > 0) {
			svg.appendChild(svgEl('rect', {
				x: String(x),
				y: String(chartBottom - barHeight),
				width: String(barWidth),
				height: String(barHeight),
				rx: '2',
				fill: 'var(--text-accent)',
				opacity: '0.8',
			}));

			const countLabel = svgEl('text', {
				x: String(x + barWidth / 2),
				y: String(chartBottom - barHeight - 3),
				'text-anchor': 'middle',
				'font-size': '9',
				'font-weight': '600',
				fill: 'var(--text-normal)',
			});
			countLabel.textContent = String(count);
			svg.appendChild(countLabel);
		}

		// Day label
		const dayLabel = svgEl('text', {
			x: String(x + barWidth / 2),
			y: String(chartBottom + 12),
			'text-anchor': 'middle',
			'font-size': '9',
			fill: 'var(--text-muted)',
		});
		dayLabel.textContent = days[i]!.label;
		svg.appendChild(dayLabel);

		// Date label (day number)
		const dateNum = days[i]!.dateStr.slice(8);
		const dateLabel = svgEl('text', {
			x: String(x + barWidth / 2),
			y: String(chartBottom + 22),
			'text-anchor': 'middle',
			'font-size': '7',
			fill: 'var(--text-faint)',
		});
		dateLabel.textContent = dateNum;
		svg.appendChild(dateLabel);
	}

	return svg;
}

export function renderPieChart(tasks: ComputedTask[]): SVGSVGElement {
	const svg = svgEl('svg', { viewBox: '0 0 200 180' });

	const activeTasks = tasks.filter(t => t.status !== 'Completed');

	const counts: Record<string, number> = {};
	for (const p of NON_COMPLETED_PRIORITIES) {
		const count = activeTasks.filter(t => t.priority === p).length;
		if (count > 0) counts[p] = count;
	}

	const entries = Object.entries(counts);
	const total = entries.reduce((sum, [, c]) => sum + c, 0);

	const cx = 100;
	const cy = 72;
	const r = 55;

	// Title
	const title = svgEl('text', {
		x: '100',
		y: '10',
		'text-anchor': 'middle',
		'font-size': '10',
		fill: 'var(--text-muted)',
		'font-weight': '600',
	});
	title.textContent = 'Priority Breakdown';
	svg.appendChild(title);

	if (total === 0) {
		svg.appendChild(svgEl('circle', {
			cx: String(cx),
			cy: String(cy),
			r: String(r),
			fill: 'none',
			stroke: 'var(--text-faint)',
			'stroke-width': '1',
			opacity: '0.4',
		}));
		const noData = svgEl('text', {
			x: String(cx),
			y: String(cy + 4),
			'text-anchor': 'middle',
			'font-size': '11',
			fill: 'var(--text-faint)',
		});
		noData.textContent = 'No tasks';
		svg.appendChild(noData);
		return svg;
	}

	if (entries.length === 1) {
		const [priority] = entries[0]!;
		svg.appendChild(svgEl('circle', {
			cx: String(cx),
			cy: String(cy),
			r: String(r),
			fill: PRIORITY_COLORS[priority as Priority] ?? 'var(--text-faint)',
			opacity: '0.8',
		}));
	} else {
		let angle = -Math.PI / 2;
		for (const [priority, count] of entries) {
			const sliceAngle = (count / total) * 2 * Math.PI;
			const startX = cx + r * Math.cos(angle);
			const startY = cy + r * Math.sin(angle);
			const endAngle = angle + sliceAngle;
			const endX = cx + r * Math.cos(endAngle);
			const endY = cy + r * Math.sin(endAngle);
			const largeArc = sliceAngle > Math.PI ? 1 : 0;

			const path = svgEl('path', {
				d: `M ${cx} ${cy} L ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY} Z`,
				fill: PRIORITY_COLORS[priority as Priority] ?? 'var(--text-faint)',
				opacity: '0.8',
			});
			svg.appendChild(path);

			angle = endAngle;
		}
	}

	// Legend
	const legendY = 148;
	const legendItemWidth = 180 / entries.length;
	const legendStartX = cx - (entries.length * legendItemWidth) / 2;

	for (let i = 0; i < entries.length; i++) {
		const [priority, count] = entries[i]!;
		const x = legendStartX + i * legendItemWidth;

		svg.appendChild(svgEl('rect', {
			x: String(x),
			y: String(legendY),
			width: '8',
			height: '8',
			rx: '1',
			fill: PRIORITY_COLORS[priority as Priority] ?? 'var(--text-faint)',
		}));

		const label = svgEl('text', {
			x: String(x + 11),
			y: String(legendY + 8),
			'font-size': '8',
			fill: 'var(--text-muted)',
		});
		label.textContent = `${priority} (${count})`;
		svg.appendChild(label);
	}

	return svg;
}
