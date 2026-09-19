import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { DetalheProblema } from './pages/DetalheProblema';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Mapa } from './pages/Mapa';
import { PainelGestor } from './pages/PainelGestor';
import { Transparencia } from './pages/Transparencia';

// Shell de rotas do app. A navegação (wordmark, links, entrar/sair) é
// responsabilidade da AppShell, compartilhada por todas as rotas — ver
// components/AppShell.tsx.
export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/mapa" element={<Mapa />} />
        <Route path="/problemas/:id" element={<DetalheProblema />} />
        <Route path="/painel-gestor" element={<PainelGestor />} />
        <Route path="/transparencia" element={<Transparencia />} />
      </Routes>
    </AppShell>
  );
}
