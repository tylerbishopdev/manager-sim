import { useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import type { AdminSection } from '../../store/adminStore';
import AdminDashboard from './AdminDashboard';
import ScenarioEditor from './ScenarioEditor';
import VenueEditor from './VenueEditor';
import SponsorEditor from './SponsorEditor';
import DialogEditor from './DialogEditor';
import NamePoolEditor from './NamePoolEditor';
import AssetManager from './AssetManager';
import CommentaryEditor from './CommentaryEditor';
import GameSettingsEditor from './GameSettingsEditor';
import FighterTierEditor from './FighterTierEditor';
import GymLevelEditor from './GymLevelEditor';

const NAV_ITEMS: { key: AdminSection; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '\u2302' },
  { key: 'scenarios', label: 'Scenarios', icon: '\u26A1' },
  { key: 'venues', label: 'Venues', icon: '\u2691' },
  { key: 'sponsors', label: 'Sponsors', icon: '\u2605' },
  { key: 'dialogs', label: 'Dialogs', icon: '\u2709' },
  { key: 'commentary', label: 'Commentary', icon: '\uD83C\uDFA4' },
  { key: 'names', label: 'Names', icon: '\u270E' },
  { key: 'fighter_tiers', label: 'Fighter Tiers', icon: '\uD83C\uDFC6' },
  { key: 'gym_levels', label: 'Gym Levels', icon: '\uD83C\uDFE0' },
  { key: 'settings', label: 'Settings', icon: '\u2699' },
  { key: 'assets', label: 'Assets', icon: '\u2B1A' },
];

interface Props {
  onBack: () => void;
}

export default function AdminPanel({ onBack }: Props) {
  const { activeSection, setSection, initFromApi } = useAdminStore();

  // Try to connect to DB on mount
  useEffect(() => {
    initFromApi();
  }, [initFromApi]);

  return (
    <div className="admin-panel">
      {/* Sidebar */}
      <nav className="admin-sidebar">
        <div className="admin-sidebar-header">
          <button className="admin-back-btn" onClick={onBack}>&larr; BACK</button>
          <h2 className="admin-logo">GAME BUILDER</h2>
        </div>
        <ul className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <li key={item.key}>
              <button
                className={`admin-nav-btn ${activeSection === item.key ? 'active' : ''}`}
                onClick={() => setSection(item.key)}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main content */}
      <main className="admin-main">
        {activeSection === 'dashboard' && <AdminDashboard />}
        {activeSection === 'scenarios' && <ScenarioEditor />}
        {activeSection === 'venues' && <VenueEditor />}
        {activeSection === 'sponsors' && <SponsorEditor />}
        {activeSection === 'dialogs' && <DialogEditor />}
        {activeSection === 'commentary' && <CommentaryEditor />}
        {activeSection === 'names' && <NamePoolEditor />}
        {activeSection === 'fighter_tiers' && <FighterTierEditor />}
        {activeSection === 'gym_levels' && <GymLevelEditor />}
        {activeSection === 'settings' && <GameSettingsEditor />}
        {activeSection === 'assets' && <AssetManager />}
      </main>
    </div>
  );
}
