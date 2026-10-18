export default function ContactsCard({ contacts }) {
  return (
    <div className="alert alert-warning flex-col items-start gap-2">
      <h2 className="font-bold text-lg">You are not alone. Please reach out to someone.</h2>
      {contacts?.length ? (
        <ul className="space-y-1">
          {contacts.map((c, i) => (
            <li key={i}>
              <span className="font-medium">{c.name}</span>
              {c.phone && <> : <a className="link" href={`tel:${c.phone}`}>{c.phone}</a></>}
            </li>
          ))}
        </ul>
      ) : (
        <p>Talk to a trusted person, a doctor, or your local emergency services.</p>
      )}
    </div>
  );
}