import { Search, Bell, HelpCircle, Menu } from 'lucide-react';

interface HeaderProps {
    onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    return (
        <header className="top-header">
            <button
                className="action-btn mobile-only"
                onClick={onMenuClick}
                style={{ marginRight: '1rem' }}
            >
                <Menu size={24} />
            </button>

            {/* Search Bar - hidden on small mobile to save space */}
            <div className="header-search mobile-hidden">
                <Search className="search-icon" size={18} />
                <input
                    type="text"
                    placeholder="Global system search..."
                    className="search-input"
                />
            </div>

            {/* Right Actions */}
            <div className="header-actions">
                <button className="action-btn" aria-label="Notifications">
                    <Bell size={20} />
                    <span className="notification-badge"></span>
                </button>

                <button className="action-btn" aria-label="Help">
                    <HelpCircle size={20} />
                </button>

                <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb', margin: '0 0.5rem' }}></div>

                <button className="header-user-btn">
                    {/* Small avatar for top right if needed, though sidebar has profile too. 
                 The screenshot shows profile in Sidebar, but typically headers also have controls.
                 I'll add a simple dropdown trigger or similar if needed. 
                 For now, just the actions. */}
                </button>
            </div>
        </header>
    );
}
