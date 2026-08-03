import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/ToastProvider';
import Dashboard from './pages/Dashboard';
import ProjectList from './pages/ProjectList';
import ProjectDetail from './pages/ProjectDetail';
import Requirements from './pages/Requirements';
import Bugs from './pages/Bugs';
import TimeLogs from './pages/TimeLogs';
import Backlog from './pages/Backlog';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/projects/:id/requirements" element={<Requirements />} />
            <Route path="/projects/:id/bugs" element={<Bugs />} />
            <Route path="/timelogs" element={<TimeLogs />} />
            <Route path="/backlog" element={<Backlog />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ToastProvider>
  );
}
