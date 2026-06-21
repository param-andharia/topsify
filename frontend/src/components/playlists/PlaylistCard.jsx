import { Link } from "react-router-dom";
import { fallbackImage, pluralize } from "../../utils/format";

export const PlaylistCard = ({ to, imageUrl, title, subtitle, stats }) => (
  <Link className="card card-link" to={to}>
    <img src={imageUrl || fallbackImage} alt={title} />
    <p>{title}</p>
    {subtitle || stats ? (
      <div className="card-meta">
        {subtitle ? <span className="card-subtitle">{subtitle}</span> : null}
        {stats ? <span className="card-stats">{stats}</span> : null}
      </div>
    ) : null}
  </Link>
);

export const ArtistCard = ({ name, imageUrl, trackCount, to }) => (
  <PlaylistCard
    to={to}
    imageUrl={imageUrl}
    title={name}
    stats={pluralize(trackCount, "track")}
  />
);

export const AlbumCard = ({ name, imageUrl, trackCount, to }) => (
  <PlaylistCard
    to={to}
    imageUrl={imageUrl}
    title={name}
    stats={pluralize(trackCount, "track")}
  />
);
