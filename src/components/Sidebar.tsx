import React from 'react';
import {
  LayoutDashboard,
  Compass,
  Database,
  TrendingDown,
  BarChart3,
  Tag,
  Swords,
  Award,
  Layers,
  Sparkles,
  Calendar,
  Cpu,
  Settings,
  ChevronLeft,
  ChevronRight,
  Droplet,
} from 'lucide-react';
import { ActiveTab, MarketplaceCode } from '../types/automotive';
import { getMpConfig } from '../utils/marketplace';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  productsCount: number;
  trackedCount: number;
  snapshotsCount?: number;
  marketplace?: MarketplaceCode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  productsCount,
  trackedCount: _trackedCount,
  snapshotsCount = 0,
  marketplace = 'AU',
}) => {
  const cfg = getMpConfig(marketplace);

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Engine Oil Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'discovery' as ActiveTab, label: 'Viscosity & Oil Finder', icon: Compass, badge: 'Live' },
    { id: 'database' as ActiveTab, label: 'Engine Oil Database', icon: Database, badge: `${productsCount}` },
    { id: 'price-tracker' as ActiveTab, label: 'Price & $/L Tracker', icon: TrendingDown, badge: 'Drops' },
    { id: 'sales-intel' as ActiveTab, label: 'Litre Sales Intelligence', icon: BarChart3, badge: null },
    { id: 'promotions' as ActiveTab, label: 'Subscribe & Save Deals', icon: Tag, badge: 'Deals' },
    { id: 'competitor-analysis' as ActiveTab, label: 'Oil Benchmark Tool', icon: Swords, badge: null },
    { id: 'brand-analysis' as ActiveTab, label: 'Oil Brand Intelligence', icon: Award, badge: null },
    { id: 'category-analysis' as ActiveTab, label: 'Viscosity Segmentation', icon: Layers, badge: 'Specs' },
    { id: 'opportunities' as ActiveTab, label: 'Oil Opportunities (0-100)', icon: Sparkles, badge: 'High ASP' },
    { id: 'monthly-archive' as ActiveTab, label: 'Monthly Snapshots', icon: Calendar, badge: `${snapshotsCount}` },
    { id: 'jobs' as ActiveTab, label: 'Oil Collection Pipeline', icon: Cpu, badge: marketplace },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings, badge: null },
  ];

  return (
    <aside
      className={`relative flex flex-col shrink-0 border-r border-purple-200/80 bg-white transition-all duration-200 z-20 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-purple-100">
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 text-white font-black text-sm tracking-wider shadow-sm shrink-0">
              <Droplet size={18} className="fill-white text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold tracking-tight text-slate-900 truncate">
                ApexLube {marketplace}
              </span>
              <span className="text-[11px] text-purple-600 font-semibold truncate">
                Amazon {marketplace} Engine Oils
              </span>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="mx-auto flex items-center justify-center w-8 h-8 rounded-lg bg-purple-600 text-white font-black text-sm shadow-sm">
            <Droplet size={18} className="fill-white text-white" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1 rounded text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left group ${
                isActive
                  ? 'bg-purple-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50/80'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                size={16}
                className={`shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-purple-500 group-hover:text-purple-700'
                }`}
              />
              {!collapsed && (
                <div className="flex items-center justify-between w-full overflow-hidden">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] tabular-nums font-mono px-1.5 py-0.5 rounded truncate max-w-[85px] ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-purple-50 text-purple-700 border border-purple-200/70'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      {!collapsed && (
        <div className="p-3 m-2.5 rounded-lg border border-purple-200/80 bg-purple-50/60 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5 text-purple-800 font-semibold mb-1">
            <Droplet size={13} className="text-purple-600" />
            <span>Engine Oils Only</span>
          </div>
          <div className="text-slate-600 leading-tight">
            Amazon {cfg.countryName} motor oils in {cfg.currency} ({cfg.currencySymbol}) with monthly snapshots.
          </div>
        </div>
      )}
    </aside>
  );
};
