import RequireAuth from '../../components/RequireAuth';
import OrderList from '../../components/OrderList';

export default function CustomerOrdersPage() {
  return (
    <RequireAuth role="customer">
      <div className="min-h-screen bg-slate-50">
        <main className="mx-auto max-w-7xl px-6 py-16">
          <h1 className="text-4xl font-semibold text-slate-950">My Orders</h1>
          <p className="mt-3 text-slate-600">Track the products you have purchased. Your order history is saved each time you check out.</p>

          <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <OrderList variant="light" />
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
