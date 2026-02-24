import { useAdminStore } from '../../store/adminStore';
import { createDefaultGameSettings, type GameSettings } from '../../types/admin';

interface SettingField {
  key: keyof GameSettings;
  label: string;
  desc: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  group: string;
}

const SETTING_FIELDS: SettingField[] = [
  // Economy
  { key: 'startingMoney', label: 'Starting Money', desc: 'Money the player begins with', min: 0, max: 100000, step: 500, unit: '$', group: 'Economy' },
  { key: 'trainingCost', label: 'Training Cost', desc: 'Cost per training session', min: 0, max: 5000, step: 50, unit: '$', group: 'Economy' },

  // Fighter Defaults
  { key: 'startingMorale', label: 'Starting Morale', desc: 'Default morale for new fighters', min: 0, max: 100, step: 5, unit: '', group: 'Fighters' },
  { key: 'maxRosterSize', label: 'Max Roster Size', desc: 'Maximum number of fighters', min: 1, max: 50, step: 1, unit: '', group: 'Fighters' },
  { key: 'injuryChance', label: 'Injury Chance', desc: 'Chance of injury in fights', min: 0, max: 100, step: 1, unit: '%', group: 'Fighters' },

  // Training
  { key: 'trainingSuccessBase', label: 'Training Success (Base)', desc: 'Success rate without trainer', min: 0, max: 100, step: 5, unit: '%', group: 'Training' },
  { key: 'trainingSuccessMax', label: 'Training Success (Max)', desc: 'Success rate with trainer', min: 0, max: 100, step: 5, unit: '%', group: 'Training' },
  { key: 'statGainMin', label: 'Stat Gain Min', desc: 'Minimum stat increase per session', min: 0, max: 2, step: 0.1, unit: '', group: 'Training' },
  { key: 'statGainMax', label: 'Stat Gain Max', desc: 'Maximum stat increase per session', min: 0, max: 2, step: 0.1, unit: '', group: 'Training' },

  // Events
  { key: 'startingReputation', label: 'Starting Reputation', desc: 'Initial gym reputation (0-100)', min: 0, max: 100, step: 5, unit: '', group: 'Events' },
  { key: 'eventChanceWeekly', label: 'Weekly Event Chance', desc: 'Chance of event on weekly ticks (every 7 days)', min: 0, max: 100, step: 5, unit: '%', group: 'Events' },
  { key: 'eventChanceDaily', label: 'Daily Event Chance', desc: 'Chance of event on non-weekly days', min: 0, max: 100, step: 1, unit: '%', group: 'Events' },
];

const DEFAULTS = createDefaultGameSettings();

export default function GameSettingsEditor() {
  const { bundle, updateGameSettings, resetGameSettings } = useAdminStore();
  const settings = bundle.gameSettings;

  const handleChange = (key: keyof GameSettings, value: number) => {
    updateGameSettings({ [key]: value });
  };

  const groups = [...new Set(SETTING_FIELDS.map((f) => f.group))];

  // Count of non-default values
  const changedCount = SETTING_FIELDS.filter(
    (f) => settings[f.key] !== DEFAULTS[f.key]
  ).length;

  return (
    <div className="admin-editor">
      <div className="admin-editor-header">
        <h1 className="admin-page-title">Game Settings</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {changedCount > 0 && (
            <span style={{ color: '#d4a017', fontSize: 9 }}>
              {changedCount} custom value{changedCount !== 1 ? 's' : ''}
            </span>
          )}
          <button
            className="admin-btn admin-btn-danger admin-btn-sm"
            onClick={() => { if (confirm('Reset all settings to defaults?')) resetGameSettings(); }}
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      <div className="admin-settings-grid">
        {groups.map((group) => (
          <div key={group} className="admin-settings-group">
            <h3 className="admin-settings-group-title">{group}</h3>
            {SETTING_FIELDS.filter((f) => f.group === group).map((field) => {
              const value = settings[field.key];
              const defaultVal = DEFAULTS[field.key];
              const isModified = value !== defaultVal;

              return (
                <div key={field.key} className="admin-setting-row">
                  <div className="admin-setting-info">
                    <label className="admin-setting-label">
                      {field.label}
                      {isModified && (
                        <span
                          className="admin-setting-reset"
                          title={`Default: ${field.unit === '$' ? '$' : ''}${defaultVal}${field.unit === '%' ? '%' : ''}`}
                          onClick={() => handleChange(field.key, defaultVal)}
                        >
                          (reset)
                        </span>
                      )}
                    </label>
                    <span className="admin-setting-desc">{field.desc}</span>
                  </div>
                  <div className="admin-setting-control">
                    <input
                      className="admin-input"
                      type="number"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={value}
                      onChange={(e) => handleChange(field.key, +e.target.value)}
                      style={{
                        width: 100,
                        textAlign: 'right',
                        borderColor: isModified ? '#d4a017' : undefined,
                      }}
                    />
                    {field.unit && (
                      <span className="admin-setting-unit">{field.unit}</span>
                    )}
                  </div>
                  {/* Comparison bar for percentage values */}
                  {field.unit === '%' && (
                    <div className="admin-setting-bar-container">
                      <div
                        className="admin-setting-bar"
                        style={{ width: `${Math.min(100, value as number)}%` }}
                      />
                      <div
                        className="admin-setting-bar-default"
                        style={{ left: `${Math.min(100, defaultVal as number)}%` }}
                        title={`Default: ${defaultVal}%`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
