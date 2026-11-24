import SupplierStock from '@/components/supplier/supplier-stock';
export const metadata = { title: 'Estoque | Fornecedor' };
export default async function Page({ searchParams }) {
  return <SupplierStock ownInputs={(await searchParams).visao === 'insumos-proprios'} />;
}
