export default function QuestionCard({ index, total, question, selectedOptionId, onSelect }) {
  return (
    <article className="qcard">
      <div className="qcard-head">
        <span className="qbadge">Pyetja {index + 1} / {total}</span>
        {question.category_name && <span className="qcat">{question.category_name}</span>}
      </div>
      <h3 className="qtext">{question.text}</h3>
      <ul className="qopts">
        {question.options.map((o) => (
          <li key={o.id}>
            <label className={`qopt ${selectedOptionId === o.id ? 'qopt-selected' : ''}`}>
              <input
                type="radio"
                name={`q-${question.id}`}
                checked={selectedOptionId === o.id}
                onChange={() => onSelect(o.id)}
              />
              <span>{o.text}</span>
            </label>
          </li>
        ))}
      </ul>
    </article>
  );
}
