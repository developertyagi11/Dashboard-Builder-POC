// Widget registrations must be imported before Dashboard renders,
// so the registry is populated when the grid first mounts.
import './widgets/CategoricalWidget';
import './widgets/TemporalWidget';
import './widgets/HierarchicalWidget';
import './widgets/RelationalWidget';

import { Dashboard } from './components/Dashboard';

export default function App() {
  return <Dashboard />;
}
