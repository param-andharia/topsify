import { fallbackImage } from "../../utils/format";

export const DetailHero = ({ imageUrl, title, eyebrow, meta = [], actions = null }) => (
  <section className="detail-hero">
    <img className="detail-hero-image" src={imageUrl || fallbackImage} alt={title} />
    <div className="detail-hero-content">
      {eyebrow ? <p className="detail-eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {meta.length ? (
        <div className="detail-meta-list">
          {meta.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      ) : null}
      {actions ? <div className="detail-hero-actions">{actions}</div> : null}
    </div>
  </section>
);

