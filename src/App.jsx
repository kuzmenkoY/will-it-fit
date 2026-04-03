import Scene from './components/Scene';
import Sidebar from './components/Sidebar';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 320 }}>
        <Scene />
      </div>
    </div>
  );
}
