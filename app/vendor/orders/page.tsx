import RequireAuth from '../../../components/RequireAuth';
import VendorNav from '../../../components/VendorNav';
import OrderList from '../../../components/OrderList';

export default function VendorOrdersPage() {
  return (
    <RequireAuth role="vendor">
      <div className="min-h-screen bg-transparent">
        <main className="mx-auto max-w-7xl px-6 py-16">
          <VendorNav />

          <section className="mt-8 rounded-[32px] border border-blue-200/50 bg-blue-600 p-10 shadow-xl shadow-slate-900/5 backdrop-blur-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Orders</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Customer orders for your products.</h1>
            <p className="mt-4 max-w-2xl text-blue-100">
              Every time a customer completes checkout, the order appears here so you can fulfill it.
            </p>

            <div className="mt-8">
              <OrderList />
            </div>
          </section>
        </main>
      </div>
    </RequireAuth>
  );
}
