import { Compass } from 'lucide-react';
import { Card } from '../components/ui';

export default function NotFound({ id }) {
  return (
    <Card className="mx-auto mt-10 max-w-lg text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-600"><Compass size={26} aria-hidden="true" /></span>
      <h1 className="mt-4 text-xl font-extrabold">Page not found</h1>
      <p className="mt-1 text-sm text-slate-500">There is no page called <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">{id}</code>. Use the menu, or go back to the dashboard.</p>
      <a href="#/dashboard" className="mt-5 inline-block rounded-xl bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800">Back to dashboard</a>
    </Card>
  );
}
