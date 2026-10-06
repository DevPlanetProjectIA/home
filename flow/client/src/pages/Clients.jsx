import React from 'react';
import Crud from '../components/Crud.jsx';
import { useCollection, useCurrency } from '../lib/ctx.jsx';

const F = [
  { key: 'name', label: 'Nome', required: true },
  { key: 'phone', label: 'Telefone / WhatsApp', half: true },
  { key: 'email', label: 'E-mail', half: true, type: 'email' },
  { key: 'doc', label: 'CPF / CNPJ', half: true },
  { key: 'cep', label: 'CEP', half: true },
  { key: 'street', label: 'Rua' },
  { key: 'number', label: 'Número', half: true },
  { key: 'complement', label: 'Complemento', half: true },
  { key: 'district', label: 'Bairro', half: true },
  { key: 'city', label: 'Cidade', half: true },
  { key: 'state', label: 'Estado / UF', half: true },
  { key: 'country', label: 'País', half: true },
  { key: 'notes', label: 'Observações', type: 'textarea' },
];

export default function Clients() {
  const c = useCollection('clients');
  const orders = useCollection('orders');
  const { fmt } = useCurrency();
  const stats = (cl) => {
    const os = orders.items.filter((o) => String(o.clientId) === String(cl.id) || o.client === cl.name);
    return { n: os.length, sum: os.reduce((s, o) => s + (o.total || 0), 0) };
  };
  return (
    <Crud title="Cadastro de Clientes" addLabel="Novo cliente" modalTitle="cliente" fields={F}
      items={c.items} loading={c.loading} defaults={{ country: 'Brasil' }} searchKeys={['name', 'phone', 'email', 'doc']}
      searchPlaceholder="Buscar por nome, telefone, e-mail ou CPF/CNPJ..." empty="Você ainda não cadastrou nenhum cliente."
      onSave={(d, id) => (id ? c.update(id, d) : c.create(d))} onDelete={c.remove}
      columns={[
        { label: 'Nome', key: 'name' }, { label: 'Telefone', key: 'phone' }, { label: 'E-mail', key: 'email' },
        { label: 'Cidade', render: (r) => [r.city, r.state].filter(Boolean).join(' / ') },
        { label: 'Pedidos', render: (r) => stats(r).n }, { label: 'Total', render: (r) => fmt(stats(r).sum) },
      ]} />
  );
}
