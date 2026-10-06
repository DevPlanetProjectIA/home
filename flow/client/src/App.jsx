import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, CurrencyProvider, ToastProvider, useAuth } from './lib/ctx.jsx';
import Layout from './components/Layout.jsx';
import Auth from './pages/Auth.jsx';
import Home from './pages/Home.jsx';
import Orders from './pages/Orders.jsx';
import Clients from './pages/Clients.jsx';
import Stats from './pages/Stats.jsx';
import Calendar from './pages/Calendar.jsx';
import Stock from './pages/Stock.jsx';
import Finance from './pages/Finance.jsx';
import Quote from './pages/Quote.jsx';
import Showcase, { PublicStore } from './pages/Showcase.jsx';
import Consigned from './pages/Consigned.jsx';
import { Calculator, Scale, Checklist } from './pages/Tools.jsx';
import Settings from './pages/Settings.jsx';
import { ComingSoon, Updates } from './pages/Misc.jsx';
import Jarros from './pages/objects/Jarros.jsx';
import Coleira from './pages/objects/Coleira.jsx';
import Chaveiros from './pages/objects/Chaveiros.jsx';
import Letreiros from './pages/objects/Letreiros.jsx';
import Caixas from './pages/objects/Caixas.jsx';
import QRCodeGen from './pages/objects/QRCodeGen.jsx';
import CordeiroCut from './pages/tools3d/CordeiroCut.jsx';
import CordeiroPaint from './pages/tools3d/CordeiroPaint.jsx';
import SeparaCores from './pages/tools3d/SeparaCores.jsx';
import MixFilamento from './pages/tools/MixFilamento.jsx';
import MixCores from './pages/tools/MixCores.jsx';
import Prompts from './pages/tools/Prompts.jsx';
import Links from './pages/tools/Links.jsx';
import Conversor3MF from './pages/tools/Conversor3MF.jsx';
import Otimizador from './pages/tools/Otimizador.jsx';
import { Aulas, Manuais } from './pages/tools/Ensino.jsx';
import { GROUPS } from './lib/nav.js';

function Guard() {
  const { user } = useAuth();
  if (user === undefined) return null;
  return user ? <Layout /> : <Navigate to="/login" replace />;
}

const soon = GROUPS.flatMap((g) => g.items).filter((i) => i.soon);

export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Auth />} />
            <Route path="/v/:slug" element={<PublicStore />} />
            <Route element={<Guard />}>
              <Route index element={<Home />} />
              <Route path="/pedidos/andamento" element={<Orders />} />
              <Route path="/pedidos/finalizados" element={<Orders done />} />
              <Route path="/clientes" element={<Clients />} />
              <Route path="/estatisticas" element={<Stats />} />
              <Route path="/calendario" element={<Calendar />} />
              <Route path="/estoque" element={<Stock />} />
              <Route path="/financeiro" element={<Finance />} />
              <Route path="/orcamento" element={<Quote />} />
              <Route path="/vitrine" element={<Showcase />} />
              <Route path="/consignados" element={<Consigned />} />
              <Route path="/ferramentas/calculadora" element={<Calculator />} />
              <Route path="/ferramentas/escala" element={<Scale />} />
              <Route path="/ferramentas/checklist" element={<Checklist />} />
              <Route path="/ferramentas/mix-filamento" element={<MixFilamento />} />
              <Route path="/ferramentas/mix-cores" element={<MixCores />} />
              <Route path="/ferramentas/prompts" element={<Prompts />} />
              <Route path="/ferramentas/links" element={<Links />} />
              <Route path="/ferramentas/conversor-3mf" element={<Conversor3MF />} />
              <Route path="/ferramentas/otimizador" element={<Otimizador />} />
              <Route path="/aulas" element={<Aulas />} />
              <Route path="/manuais" element={<Manuais />} />
              <Route path="/objetos/jarros" element={<Jarros />} />
              <Route path="/objetos/coleira" element={<Coleira />} />
              <Route path="/objetos/chaveiros" element={<Chaveiros />} />
              <Route path="/objetos/letreiros" element={<Letreiros />} />
              <Route path="/objetos/caixas" element={<Caixas />} />
              <Route path="/objetos/qrcode" element={<QRCodeGen />} />
              <Route path="/3d/cut" element={<CordeiroCut />} />
              <Route path="/3d/paint" element={<CordeiroPaint />} />
              <Route path="/3d/separa-cores" element={<SeparaCores />} />
              <Route path="/configuracoes" element={<Settings />} />
              <Route path="/atualizacoes" element={<Updates />} />
              {soon.map((i) => <Route key={i.to} path={i.to} element={<ComingSoon />} />)}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </ToastProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}
