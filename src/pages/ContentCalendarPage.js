import storage from '../services/storage.js';

class ContentCalendarPage {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.articles = [];
    }

    render() {
        this.articles = storage.getArticles().filter(a => a.status === 'scheduled' || a.status === 'published');

        return `
        <div class="page-container calendar-page">
            <div class="page-header">
                <div>
                    <h1 class="page-title">Content Calendar</h1>
                    <p class="page-subtitle">Manage your publication schedule and discover optimal posting times.</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-secondary" id="todayBtn">Today</button>
                    <div class="calendar-nav-group">
                        <button class="btn-icon" id="prevMonthBtn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="15 18 9 12 15 6"/>
                            </svg>
                        </button>
                        <h3 class="current-month-label" id="monthLabel">
                            ${this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button class="btn-icon" id="nextMonthBtn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div class="calendar-layout">
                <div class="calendar-main">
                    <div class="calendar-grid-header">
                        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                    </div>
                    <div class="calendar-grid" id="calendarGrid">
                        ${this._renderCalendarDays()}
                    </div>
                </div>

                <div class="calendar-sidebar">
                    <div class="calendar-card ai-suggestions-card">
                        <div class="card-header">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-accent">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                            </svg>
                            <h3>AI Insights</h3>
                        </div>
                        <div class="card-body">
                            <div class="ai-tip">
                                <span class="tip-label">Optimal Posting Time</span>
                                <p>Tuesday mornings at 9:15 AM EST show 24% higher engagement for <b>Workforce</b> topics.</p>
                            </div>
                            <div class="ai-tip">
                                <span class="tip-label">Content Gap</span>
                                <p>You haven't posted about <b>Hybrid Work</b> in 12 days. Consider scheduling an article for Friday.</p>
                            </div>
                        </div>
                    </div>

                    <div class="calendar-card upcoming-events">
                        <h3>Schedule for ${this.selectedDate.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })} <span style="font-size: 0.7rem; color: var(--color-accent-secondary); margin-left: auto;">PHT (UTC+8)</span></h3>
                        <div class="upcoming-list" id="dayDetailList">
                            ${this._renderDayDetails()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    mount() {
        document.getElementById('prevMonthBtn')?.addEventListener('click', () => this._changeMonth(-1));
        document.getElementById('nextMonthBtn')?.addEventListener('click', () => this._changeMonth(1));
        document.getElementById('todayBtn')?.addEventListener('click', () => {
            this.currentDate = new Date();
            this.renderToApp();
        });

        this._bindDayClicks();
    }

    _changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderToApp();
    }

    _renderCalendarDays() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        let html = '';

        // Prev month padding
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDay - 1; i >= 0; i--) {
            html += `<div class="calendar-day muted">${prevMonthLastDay - i}</div>`;
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            const isSelected = this.selectedDate.getDate() === day && this.selectedDate.getMonth() === month && this.selectedDate.getFullYear() === year;

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            // Fixed: Compare local date parts instead of ISO string start to avoid timezone shifts
            const dayArticles = this.articles.filter(a => {
                if (!a.scheduledAt) return false;
                const d = new Date(a.scheduledAt);
                return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
            });

            html += `
                <div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${dateStr}">
                    <span class="day-number">${day}</span>
                    <div class="day-events">
                        ${dayArticles.map(a => `<div class="event-dot dot-${a.status}" title="${a.status}: ${a.headline}"></div>`).join('')}
                    </div>
                </div>
            `;
        }

        return html;
    }

    _renderDayDetails() {
        const year = this.selectedDate.getFullYear();
        const month = this.selectedDate.getMonth();
        const day = this.selectedDate.getDate();

        // Fixed: Use local date parts for consistency
        const dayArticles = this.articles.filter(a => {
            if (!a.scheduledAt) return false;
            const d = new Date(a.scheduledAt);
            return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
        });

        if (dayArticles.length === 0) {
            return `<p class="empty-text">No articles scheduled for this date.</p>`;
        }

        return dayArticles.map(a => `
            <div class="upcoming-item">
                <div class="item-time">${new Date(a.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div class="item-content">
                    <span class="item-title">${a.headline || a.topic}</span>
                    <span class="item-meta">Status: Scheduled</span>
                </div>
            </div>
        `).join('');
    }

    _bindDayClicks() {
        document.querySelectorAll('.calendar-day[data-date]').forEach(el => {
            el.addEventListener('click', () => {
                const [y, m, d] = el.dataset.date.split('-').map(Number);
                this.selectedDate = new Date(y, m - 1, d);
                this.renderToApp();
            });
        });
    }

    renderToApp() {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = this.render();
            this.mount();
        }
    }
}

export default ContentCalendarPage;
