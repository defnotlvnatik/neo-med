export default function Timeline({ events }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full">
      <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2">Activity Timeline</h3>
      
      {events.length === 0 ? (
        <p className="text-slate-500 text-center py-4">No recent activity.</p>
      ) : (
        <div className="relative border-l border-slate-200 ml-3 space-y-6">
          {events.map((ev, i) => (
            <div key={i} className="relative pl-6">
              <span className={`absolute -left-2 top-1.5 w-4 h-4 rounded-full border-4 border-white ${
                ev.type === 'upload' ? 'bg-blue-500' :
                ev.type === 'grant' ? 'bg-emerald-500' : 'bg-red-500'
              }`}></span>
              <p className="text-sm font-medium text-slate-800">{ev.message}</p>
              <p className="text-xs text-slate-500 mt-1">{ev.time.toLocaleTimeString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
