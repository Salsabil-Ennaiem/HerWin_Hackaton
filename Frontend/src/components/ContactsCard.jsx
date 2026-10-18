export default function ContactsCard({ contacts }) {
  if (!contacts?.length) return null;
  return (
    <div className="card bg-error/10 border border-error/40">
      <div className="card-body">
        <h2 className="card-title">You are not alone 💛</h2>
        <p className="text-sm">It sounds like things are really hard right now. Please reach out to someone:</p>
        <ul className="space-y-2">
          {contacts.map((c) => (
            <li key={c.name} className="flex flex-col">
              <span className="font-semibold">{c.name}</span>
              {c.phone && c.phone !== "EDIT-ME" && (
                <a className="link link-primary" href={`tel:${c.phone}`}>{c.phone}</a>
              )}
              {c.url && <a className="link link-primary" href={c.url} target="_blank" rel="noreferrer">{c.url}</a>}
              <span className="text-xs opacity-70">{c.note}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
