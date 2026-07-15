import RequireAuth from '../../components/RequireAuth';
import OrderList from '../../components/OrderList';
import PageHero from '../../components/PageHero';

export default function CustomerOrdersPage() {
  return (
    <RequireAuth role="customer">
      <div className="min-h-screen bg-transparent">
        <main className="mx-auto max-w-7xl px-6 py-16">
          <PageHero>
            <p className="text-sm uppercase tracking-[0.3em] text-sky-100">Your account</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">My Orders</h1>
            <p className="mt-3 text-sky-100">Track the products you have purchased. Your order history is saved each time you check out.</p>

            <div className="mt-8">
              <OrderList variant="light" />
            </div>
          </PageHero>
        </main>
      </div>
    </RequireAuth>
  );
}
