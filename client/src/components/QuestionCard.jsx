export default function QuestionCard({ index, total, question, selectedOptionId, onSelect, feedback }) {
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
        {question.options.map((o) => {
          let fbCls = '';
          if (feedback) {
            if (o.id === feedback.correctId) fbCls = 'qopt-correct';
            else if (o.id === feedback.selectedId) fbCls = 'qopt-wrong';
          }
          const isSelected = selectedOptionId === o.id || feedback?.selectedId === o.id;
          return (
            <li key={o.id}>
              <label className={`qopt ${isSelected && !feedback ? 'qopt-selected' : ''} ${fbCls}`}>
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  checked={isSelected}
                  disabled={!!feedback}
                  onChange={() => onSelect(o.id)}
                />
                {o.image_svg ? (
                  <span className="qopt-svg" dangerouslySetInnerHTML={{ __html: o.image_svg }} />
                ) : (
                  <span>{o.text}</span>
                )}
                {feedback && o.id === feedback.correctId && <span className="ok-tag">✓ E sakte</span>}
              </label>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
