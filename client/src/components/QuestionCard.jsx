export default function QuestionCard({ index, total, question, selectedOptionId, onSelect }) {
  const hasOptionImages = question.options.some((o) => o.image_svg);
  return (
    <article className="qcard">
      <div className="qcard-head">
        <span className="qbadge">Pyetja {index + 1} / {total}</span>
        {question.category_name && <span className="qcat">{question.category_name}</span>}
      </div>
      <h3 className="qtext">{question.text}</h3>
      {question.image_svg && (
        <div className="q-svg" dangerouslySetInnerHTML={{ __html: question.image_svg }} />
      )}
      <ul className={`qopts ${hasOptionImages ? 'qopts-grid' : ''}`}>
        {question.options.map((o) => (
          <li key={o.id}>
            <label className={`qopt ${selectedOptionId === o.id ? 'qopt-selected' : ''}`}>
              <input
                type="radio"
                name={`q-${question.id}`}
                checked={selectedOptionId === o.id}
                onChange={() => onSelect(o.id)}
              />
              {o.image_svg ? (
                <span className="qopt-svg" dangerouslySetInnerHTML={{ __html: o.image_svg }} />
              ) : (
                <span>{o.text}</span>
              )}
            </label>
          </li>
        ))}
      </ul>
    </article>
  );
}
