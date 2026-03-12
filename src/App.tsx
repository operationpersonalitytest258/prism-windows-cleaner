import { useState } from 'react';
import { FluentProvider } from '@fluentui/react-components';
import { moleDarkTheme } from './theme';
import { Sidebar, PageId } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Cleaner } from './pages/Cleaner';
import { Uninstaller } from './pages/Uninstaller';
import { Optimizer } from './pages/Optimizer';
import { Analyzer } from './pages/Analyzer';
import { Monitor } from './pages/Monitor';
import { Purger } from './pages/Purger';
import { Settings } from './pages/Settings';
import './index.css';

function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');

  return (
    <FluentProvider theme={moleDarkTheme}>
      <div className="app-layout">
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
        <main className="main-content">
          <div style={{ display: activePage === 'dashboard' ? 'block' : 'none', height: '100%' }}>
            <Dashboard onNavigate={setActivePage} />
          </div>
          <div style={{ display: activePage === 'cleaner' ? 'flex' : 'none', height: '100%', overflow: 'hidden' }}>
            <Cleaner />
          </div>
          <div style={{ display: activePage === 'uninstaller' ? 'block' : 'none', height: '100%' }}>
            <Uninstaller />
          </div>
          <div style={{ display: activePage === 'optimizer' ? 'block' : 'none', height: '100%' }}>
            <Optimizer />
          </div>
          <div style={{ display: activePage === 'analyzer' ? 'block' : 'none', height: '100%' }}>
            <Analyzer />
          </div>
          <div style={{ display: activePage === 'monitor' ? 'block' : 'none', height: '100%' }}>
            <Monitor />
          </div>
          <div style={{ display: activePage === 'purger' ? 'block' : 'none', height: '100%' }}>
            <Purger />
          </div>
          <div style={{ display: activePage === 'settings' ? 'block' : 'none', height: '100%' }}>
            <Settings />
          </div>
        </main>
      </div>
    </FluentProvider>
  );
}

export default App;
