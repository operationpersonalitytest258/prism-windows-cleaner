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

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard onNavigate={setActivePage} />;
      case 'cleaner':
        return <Cleaner />;
      case 'uninstaller':
        return <Uninstaller />;
      case 'optimizer':
        return <Optimizer />;
      case 'analyzer':
        return <Analyzer />;
      case 'monitor':
        return <Monitor />;
      case 'purger':
        return <Purger />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={setActivePage} />;
    }
  };

  return (
    <FluentProvider theme={moleDarkTheme}>
      <div className="app-layout">
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
        <main className="main-content">{renderPage()}</main>
      </div>
    </FluentProvider>
  );
}

export default App;
