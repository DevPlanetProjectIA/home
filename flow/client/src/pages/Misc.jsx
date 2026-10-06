import React from 'react';
import { useLocation } from 'react-router-dom';
import { Hammer } from 'lucide-react';
import { TITLES } from '../lib/nav.js';

export function ComingSoon() {
  const { pathname } = useLocation();
  const t = TITLES[pathname];
  return (
    <div className="card mx-auto mt-10 flex max-w-md flex-col items-center gap-3 py-14 text-center">
      <Hammer className="text-primary" size={32} />
      <h2 className="text-lg font-semibold">{t?.title || 'Ferramenta'}</h2>
      <p className="text-sm text-muted-foreground">{t?.sub}</p>
      <span className="badge bg-warning/15 text-warning">Em desenvolvimento</span>
    </div>
  );
}

export function Updates() {
  const log = [['1.0.0', 'Primeira versão: pedidos, clientes, estoque, financeiro, orçamento em PDF, vitrine pública e consignados.']];
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      {log.map(([v, t]) => <div key={v} className="card"><span className="badge bg-primary/15 text-primary">v{v}</span><p className="mt-2 text-sm">{t}</p></div>)}
    </div>
  );
}
